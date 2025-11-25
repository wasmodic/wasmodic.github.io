<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { Menu, Progress } from '@skeletonlabs/skeleton-svelte';
import { AnsiUp } from "ansi_up";
import { watchResize } from "svelte-watch-resize";
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SerializeAddon } from "@xterm/addon-serialize";
import { Terminal } from '@xterm/xterm';
import { V86 } from "$thirdparty/v86/libv86";
import { EXEC_MODE_BUS, EXEC_MODE_TERMINAL_HIDDEN, cli } from "$stores/cli";
import { LocalState, log } from "$src/utils";
import {
	BUS_OUTPUT_CUSTOM_COMMAND,
	BUS_INPUT,
	BUS_OUTPUT,
	DEBIAN_STATE_ID,
	DIR_TUTORIAL,
	LOGGING_INFO,
	MAX_FILE_SIZE_TO_CACHE,
	URL_ASSETS
} from "$src/config";

import "@xterm/xterm/css/xterm.css";

const DEBUG = false;
const SYNC_FS = false;

window["Terminal"] = Terminal;

// =============================================================================
// State
// =============================================================================

export let terminalId: string = "terminal";
export let files: string[] = []; // Files to preload on the FS from /data/<tutorial>
export let assets: string[] = []; // Files to preload on the FS from assets.sandbox.bio/tutorials/<tutorial>
export let init: string = ""; // Command to run to initialize the environment (optional)
export let tools: string[] = []; // For these tools, pre-download .bin files (optional)
export let intro: string = ""; // Intro string to display on Terminal once ready (optional; not currently used in any tutorial)

let loading: boolean = true; // Loading the terminal
let loadingStatus: string[] = []; // Loading progress to show (each element = 1 line)
let mounted: boolean = false; // Component is mounted and ready to go
let divXtermTerminal: HTMLDivElement; // Xterm.js terminal
let inputMountFiles: HTMLInputElement; // Hidden HTML file input element for mounting local file
let inputMountFolder: HTMLInputElement; // Hidden HTML file input element for mounting local folder
let modalKbdOpen: boolean = false; // Set to true when the shortcuts modal is open
let modalKbdToggle = () => (modalKbdOpen = !modalKbdOpen);
let timerSyncFS: ReturnType<typeof setTimeout>; // JS timeout used to sync filesystem contents
let timerWaitForPrompt: ReturnType<typeof setInterval>; // Wait for root@localhost prompt to be visible
let isInitializing: boolean = false; // Flag to prevent multiple simultaneous initializations
let initRetryCount: number = 0; // Track initialization retry attempts
const MAX_INIT_RETRIES = 1; // Maximum number of initialization retries

function getEnvironmentInfo() {
	// Uncomment for debugging assets on other environments
	// return environments["stg.sandbox.bio"];

	// If running tests on GitHub or using preview branches, run them on prd assets, despite being on localhost
	// if (env.PUBLIC_USE_PRD_ASSETS === "true" || window.location.hostname.endsWith(".sandbox-bio.pages.dev")) return environments["sandbox.bio"];

	// Otherwise, use hostname
	const envInfo = {
		url: "",
		v86: ""
	}
	return envInfo;
}

// =============================================================================
// Initialization
// =============================================================================

// Needs to be mounted or get errors on first mount
$: if (mounted && terminalId) initialize(terminalId);
onMount(() => (mounted = true));
onDestroy(cleanupTimers);

function cleanupTimers(): void {
	clearTimeout(timerSyncFS);
	clearInterval(timerWaitForPrompt);
}

function addLoadingStatus(msg: string): void {
	loadingStatus = [...loadingStatus, msg];
}

function initialize(id: string): void {
	// Prevent multiple simultaneous initializations
	if (isInitializing) {
		console.log("Already initializing, skipping...");
		return;
	}
	
	// Check retry limit
	if (initRetryCount >= MAX_INIT_RETRIES) {
		console.error("Max initialization retries reached. Terminal failed to load.");
		isInitializing = false;
		loading = false;
		return;
	}
	
	console.log("Initializing terminal...", id);
	isInitializing = true;
	loading = true;
	console.time("initialize");
	addLoadingStatus("Setting up your terminal...");

	// Cleanup
	cleanupTimers();
	console.log($cli.emulator)
	// Only destroy if emulator exists and has been fully initialized
	// @ts-ignore - serial_adapter exists but not in type definition
	if ($cli.emulator && $cli.emulator.serial_adapter && typeof $cli.emulator.destroy === 'function') {
		try {
			// $cli.emulator.destroy();
		} catch (e) {
			console.warn("Error destroying emulator:", e);
		}
	}
	$cli.emulator = null;

	// Create emulator
	const envInfo = getEnvironmentInfo();
	$cli.emulator = new V86({
		wasm_path: `${envInfo.url}/v86/v86.wasm`,
		memory_size: 512 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
		// initial_state: { url: `${envInfo.url}/v86/${envInfo.v86}debian-state-${DEBIAN_STATE_ID}.bin.zst` },
		initial_state: { url: `${envInfo.url}/v86/alpine-state.bin.zst`, size: 50 * 1024 * 1024 },
		filesystem: { 
			baseurl: `${envInfo.url}/v86/alpine-rootfs-flat/`,
			basefs: `${envInfo.url}/v86/alpine-fs.json`,
		},
		bios: { url: `${envInfo.url}/v86/bios/seabios.bin`, size: 512 * 1024 },
        vga_bios: { url: `${envInfo.url}/v86/bios/vgabios.bin`, size: 512 * 1024 },
		autostart: true,
		screen_container: DEBUG ? document.getElementById("screen_container") : null,
		serial_container_xtermjs: divXtermTerminal,
		disable_mouse: true, // make sure we're still able to select text on the screen
		disable_speaker: true,
		bzimage_initrd_from_filesystem: true,
        cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable",
	});

	// Listen on the special ttyS1 port for communication from within the emulator
	let output = "";
	$cli.emulator.add_listener(BUS_OUTPUT_CUSTOM_COMMAND, async (byte) => {
		const char = String.fromCharCode(byte);
		if (char !== "\n") {
			output += char;
		} else {
			try {
				const command = JSON.parse(output) as { type: string; params: any };
				const params = command.params;
				console.log("Command:", command);

				// Open file contents in a new tab
				if (command.type === "open") {
					const contents = await $cli.emulator!.read_file(params.path);
					const blob = new Blob([contents as BlobPart], { type: params.path.endsWith(".html") ? "text/html" : "text/plain" });
					const url = URL.createObjectURL(blob);
					window.open(url);

					// Launch file download
				} else if (command.type === "download") {
					const contents = await $cli.emulator!.read_file(params.path);
					const blob = new Blob([contents as BlobPart], { type: "application/octet-stream" });
					const url = URL.createObjectURL(blob);

					// Create link element to customize the filename, otherwise it's a UUID.
					const fileLink = document.createElement("a");
					fileLink.href = url;
					fileLink.download = params.path.split("/").pop() || "download";
					fileLink.click();

					// Make fetch call and return result
					// Storing result in file; when try to store result in /dev/ttyS2, it adds a bunch of "\n" and skips the first few bytes
				} else if (command.type === "fetch" && params.url && params.output && params.sentinel) {
					// Download file and save to FS
					const buffer = await fetch(params.url).then((d) => d.arrayBuffer());
					await $cli.emulator!.create_file(params.output, new Uint8Array(buffer));
					await $cli.emulator!.create_file(params.sentinel, new Uint8Array([]));
				}
			} catch (e) {
				console.log("Received:", output);
				console.error(e);
			}

			output = "";
		}
	});

	// Listen for outputs
	let initial_screen = "";
	const listenerWaitForPrompt = async (byte: number) => (initial_screen += String.fromCharCode(byte));
	$cli.emulator.add_listener(BUS_OUTPUT, listenerWaitForPrompt);

	// Prepare terminal environment
	$cli.emulator.bus.register("emulator-loaded", async () => {
		$cli.xterm = $cli.emulator!.serial_adapter.term;
		console.log("Xterm.js terminal:", $cli.xterm);
		$cli.listeners = $cli.emulator!.bus.listeners[BUS_OUTPUT];

		// Make sure everything loaded correctly. If not, try again.
		// Otherwise, get issues where `term` variable is null and waiting for it to be set does not help.
		if (!$cli.xterm) {
			loading = false;
			isInitializing = false;
			initRetryCount++;
			console.warn("Could not load terminal; serial_adapter not defined.");
			setTimeout(() => initialize(terminalId), 500);
			return;
		}
		
		// Reset retry count on successful initialization
		initRetryCount = 0;

		// Initialize addons
		$cli.addons = {
			serialize: new SerializeAddon(), // Used to export terminal to HTML
			fit: new FitAddon(), // Fit the terminal onto the screen
			links: new WebLinksAddon() // Turns text links into hyperlinks
		};
		for (const addonName in $cli.addons) {
			const addon = $cli.addons[addonName as keyof typeof $cli.addons];
			if (!addon) continue;
			$cli.xterm.loadAddon(addon);
		}
		console.log("Terminal ready.", $cli);

		// Mount tutorial files and previously synced FS (user's FS overrides default tutorial files)
		addLoadingStatus("Loading files...");
		await mountTutorialFiles();
		await fsLoad();

		// Preload tools so by the time the user needs them, they are cached. We're done fetching
		// data from the server so won't compete with other fetch requests.  We use "&" to download
		// files in parallel as much as possible. The alternative would be to download .bin
		// files directly but we'd have to generate a list of .bin from `debian-base-fs.json`,
		// which is prone to changes.
		$cli.exec(`sync & echo & ls & ll & pwd`, { mode: EXEC_MODE_BUS });
		$cli.exec(tools.map((t) => `timeout 2 ${t}`).join(" & "), { mode: EXEC_MODE_BUS });

		// Run initialization commands
		addLoadingStatus("Initializing environment...");
		$cli.exec(init);
		// Set initial terminal size, otherwise sometimes doesn't call that function at load time
		handleResize(true);
		// Focus cursor on command line
		$cli.xterm.focus();
		$cli.xterm.options.cursorBlink = true;
		// $cli.xterm.options.fontSize = 16;	
		
		// Sync date and time (otherwise continues from date/time from last boot)
		$cli.exec(`date -s "${new Date().toString()}"`, { mode: EXEC_MODE_BUS });

		// Make sure root@localhost prompt shows up on screen
		addLoadingStatus("Putting the finishing touches...");
		timerWaitForPrompt = setInterval(() => {
			if (!initial_screen.includes("â")) { // because we are using starship prompt ❯
				// Press Ctrl + L (key code 12) to show the prompt but without extra lines above it
				$cli.emulator!.bus.send(BUS_INPUT, 12);
				
			} else {
				$cli.emulator!.remove_listener(BUS_OUTPUT, listenerWaitForPrompt);
				clearInterval(timerWaitForPrompt);
				loading = false;
				isInitializing = false;
				console.timeEnd("initialize");

				// Start syncing FS
				fsSync();
			}
		}, 200);
		console.log("Emulator setup complete.");
		if (intro) {
			console.log("Writing intro to terminal.");
			setTimeout(() => {
				$cli.xterm?.write(intro);
				$cli.exec("");
			}, 1000);
		}
	});
}

// When window resizes, update terminal size
let currDims: { cols: number | null; rows: number | null } = { cols: null, rows: null };
function handleResize(firstTime: boolean = false): void {
	if (loading && !firstTime) return;
	if (!$cli.addons.fit) return;

	$cli.addons.fit.fit();

	// If we resize the terminal's number of rows/cols on xterm.js, we also need to update those
	// values for the actual terminal itself. Otherwise, the following issues arise:
	// - Long commands don't wrap to the next line and start overwriting the start of the command
	// - Editing previously run long-commands shows odd spacing behavior
	// - TUIs like `top` and `vim` don't load in full screen
	const dims = $cli.addons.fit.proposeDimensions();
	if (!dims?.cols || !dims?.rows || (currDims.cols === dims.cols && currDims.rows === dims.rows)) return;
	currDims = dims;

	// Limitation: this doesn't work if you're inside vim/less/etc, or halfway through a command
	// before resizing, but that should be less likely.
	if (firstTime) log(LOGGING_INFO, "Set terminal size", dims);
	else log(LOGGING_INFO, "Resize terminal", dims);
	$cli.exec(`stty rows ${dims.rows} cols ${dims.cols}`, {
		mode: firstTime ? EXEC_MODE_TERMINAL_HIDDEN : undefined
	});
}

// =============================================================================
// File system sync
// =============================================================================

async function fsSync(): Promise<void> {
	if (!SYNC_FS) return;
	try {
		await fsSave();
		timerSyncFS = setTimeout(fsSync, 2000);
	} catch (error) {
		console.warn(error);
	}
}

// Save FS state to localforage
async function fsSave(): Promise<void> {
	const id = terminalId;

	// Clear the cache before we save the file system state (otherwise, some files get stored as empty files)
	await $cli.clearCache();

	// Export FS state
	const files = $cli.ls(DIR_TUTORIAL);

	for (const file of files) {
		// If file, get contents
		if (!file.isDir) {
			const contents = await $cli.readFile(file.path);
			if (contents && contents.length <= MAX_FILE_SIZE_TO_CACHE) {
				file.contents = contents;
			}
		}
	}

	// Only sync FS if did not switch tutorials in the middle of syncing the FS
	if (terminalId === id) await LocalState.setFS(terminalId, files);
}

// Load FS state from localforage
async function fsLoad(): Promise<void> {
	const files = await LocalState.getFS(terminalId);
	for (const file of files) {
		if (file.isDir) {
			await $cli.createFolder(file.path);
		} else if (file.contents) {
			await $cli.createFile(file.path, file.contents);
		} else {
			console.warn(`Skipping file ${file?.path} because too large to save in browser.`);
		}
	}
}

// =============================================================================
// Sidebar operations
// =============================================================================

// Mount tutorial files
async function mountTutorialFiles(): Promise<void> {
	// Clear cache before we mount files, otherwise they don't change!
	await $cli.clearCache();

	// Mount files stored in this repo
	for (const fileName of files) {
		const url = `/data/${terminalId}/${fileName}`;
		await $cli.mountFile(`${DIR_TUTORIAL}/${fileName}`, url);
	}
	// Mount files stored in assets.sandbox.bio because of their size
	for (const fileName of assets || []) {
		const url = `https://assets.sandbox.bio/tutorials/${terminalId}/${fileName}`;
		await $cli.mountFile(`${DIR_TUTORIAL}/${fileName}`, url);
	}
}

// Export ANSI to HTML and open in new tab
function exportHTML(): void {
	const terminalRaw = $cli.addons.serialize?.serialize();
	if (!terminalRaw) {
		console.warn("Could not export terminal contents; terminal not ready yet.");
		return;
	}
	const terminalHTML = "<pre>" + new AnsiUp().ansi_to_html(terminalRaw) + "</pre>";
	const blob = new Blob([terminalHTML], { type: "text/html" });
	const url = URL.createObjectURL(blob);
	window.open(url);
}

// Mount local file to virtual file system
async function mountLocalFile(event: Event): Promise<void> {
	const target = event.target as HTMLInputElement;
	const files = target.files;
	if (!files) {
		console.warn("No file specified.");
		return;
	}

	// Mount files and show them on screen
	const paths: string[] = [];
	for (const file of files) {
		// Try to preserve folder structure
		const fileName = file?.webkitRelativePath || file.name;
		paths.push(await $cli.mountFile(`/root/${fileName}`, file));
	}
	const pathsTxt = paths.join("\n\r# ");
	$cli.xterm?.write(`\n\n\r\u001b[0;32m# Files mounted:\n\r# ${pathsTxt}\u001b[0m\n\n\r`);
	$cli.exec("");

	// Reset file selection (e.g. if select same file name again, should remount it because contents might be different)
	target.value = "";
}
</script>

<!-- Terminal -->
{#if loading}
	<div style="position:absolute">
		<div class="text-light font-monospace small">
			<Progress value={null} class="w-fit inline-block align-middle">
				<Progress.Circle style="--size: 20px; --thickness: 3px;">
					<Progress.CircleTrack />
					<Progress.CircleRange />
				</Progress.Circle>
			</Progress>
			{#each loadingStatus as status, i}
				<span class:ps-4={i > 0}>
					{status}
				</span>
				{#if i < loadingStatus.length - 1}
					<span class="text-success fw-bold">ok</span>
				{/if}
				<br />
			{/each}
		</div>
	</div>
{/if}
<div id="terminal" bind:this={divXtermTerminal} use:watchResize={() => handleResize()} class:opacity-0={loading}>
	<div class="cli-options">
		<Menu>
			<Menu.Trigger class="btn btn-dark btn-sm">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
					<path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
				</svg>
			</Menu.Trigger>
			<Menu.Positioner>
				<Menu.Content class="bg-dark text-light border border-secondary rounded shadow-lg p-1">
					<!-- {#if terminalId !== "playground"}
						<Menu.Item value="reset" onclick={mountTutorialFiles} class="menu-item">
							<Menu.ItemText>Reset tutorial files</Menu.ItemText>
						</Menu.Item>
					{/if} -->
					<Menu.Item value="mount-files" onclick={() => inputMountFiles.click()} class="menu-item">
						<Menu.ItemText>Mount local files</Menu.ItemText>
					</Menu.Item>
					<Menu.Item value="mount-folder" onclick={() => inputMountFolder.click()} class="menu-item">
						<Menu.ItemText>Mount local folder</Menu.ItemText>
					</Menu.Item>
					<Menu.Item value="export" onclick={exportHTML} class="menu-item">
						<Menu.ItemText>Export as HTML</Menu.ItemText>
					</Menu.Item>
					<!-- <Menu.Item value="shortcuts" onclick={modalKbdToggle} class="menu-item">
						<Menu.ItemText>Shortcuts</Menu.ItemText>
					</Menu.Item> -->
				</Menu.Content>
			</Menu.Positioner>
		</Menu>
	</div>
</div>

<!-- <div id="screen_container">
    <div style="white-space: pre; font: 14px monospace; line-height: 14px"></div>
    <canvas style="display: none"></canvas>
</div> -->

<!-- Hidden input file for mounting local files -->
<input type="file" on:change={mountLocalFile} bind:this={inputMountFiles} style="display:none" multiple />
<input type="file" on:change={mountLocalFile} bind:this={inputMountFolder} style="display:none" multiple webkitdirectory />

<style>
/* Xterm */
#terminal {
	/* height: 400px; */
	overflow: hidden;
}

/* Hamburger menu */
.cli-options {
	position: absolute;
	right: 0;
	z-index: 100;
}

.cli-options:hover {
	color: white !important;
}

/* Menu items styling */
:global(.menu-item) {
	padding: 0.5rem 1rem;
	cursor: pointer;
	border-radius: 0.25rem;
	transition: background-color 0.2s;
}

:global(.menu-item:hover) {
	background-color: rgba(255, 255, 255, 0.1);
}
</style>