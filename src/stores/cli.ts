import { get, writable, type Writable } from "svelte/store";
import type { Terminal } from "@xterm/xterm";
import type { FitAddon } from "@xterm/addon-fit";
import type { SerializeAddon } from "@xterm/addon-serialize";
import type { WebLinksAddon } from "@xterm/addon-web-links";
import type { V86 } from "$thirdparty/v86/libv86";
import { BUS_INPUT, BUS_OUTPUT, BUS_OUTPUT_EXERCISE_CHECK, DIR_TUTORIAL, FILE_EXERCISE_CHECK } from "$src/config";
import { strToChars } from "$src/utils";

export const EXEC_MODE_TERMINAL = "terminal";
export const EXEC_MODE_TERMINAL_HIDDEN = "terminal-hidden";
export const EXEC_MODE_BUS = "bus";
const SANDBOX_END_MARKER = "__sandbox__";

// Type definitions
export type ExecMode = typeof EXEC_MODE_TERMINAL | typeof EXEC_MODE_TERMINAL_HIDDEN | typeof EXEC_MODE_BUS;

interface ExecOptions {
	mode?: ExecMode;
	callbackExercise?: ((output: string) => void) | null;
}

export interface FileInfo {
	path: string;
	isDir: boolean;
	contents?: Uint8Array;
}

interface CliStore {
	// -------------------------------------------------------------------------
	// State
	// -------------------------------------------------------------------------
	emulator: V86 | null;
	listeners: Array<(byte: number) => void>;
	xterm: Terminal | null;
	addons: {
		serialize: SerializeAddon | null;
		fit: FitAddon | null;
		links: WebLinksAddon | null;
	};

	// -------------------------------------------------------------------------
	// Utilities
	// -------------------------------------------------------------------------

	// Run a command on the command line. Callback only used by exercise checking since not sharing serial ports.
	exec: (cmd: string, options?: ExecOptions) => void;

	// List files in a folder recursively (if path is to a file, returns [] if exists, undefined otherwise)
	ls: (path: string) => FileInfo[];

	// Mount a File object or URL to the file system
	mountFile: (path: string, file: File | string) => Promise<string>;

	// Read file from path as Uint8Array
	readFile: (path: string) => Promise<Uint8Array | undefined>;

	// Create a file, given a path and contents (string or Uint8Array)
	createFile: (path: string, contents: string | Uint8Array) => Promise<void>;

	// Create a folder recursively
	createFolder: (path: string) => Promise<void>;

	// Clear file system cache
	clearCache: () => Promise<void>;
}

// Current tutorial
export const cli: Writable<CliStore> = writable({
	// -------------------------------------------------------------------------
	// State
	// -------------------------------------------------------------------------
	emulator: null,
	listeners: [],
	xterm: null,
	addons: {
		serialize: null,
		fit: null,
		links: null
	},

	// -------------------------------------------------------------------------
	// Utilities
	// -------------------------------------------------------------------------

	// Run a command on the command line. Callback only used by exercise checking since not sharing serial ports.
	exec: (cmd: string, { mode = EXEC_MODE_TERMINAL, callbackExercise = null }: ExecOptions = {}) => {
		let command = `${cmd}\n`;
		command = command.replace(/ \\ /g, ""); // for commands in tutorials split over multiple lines

		const chars = strToChars(command);
		const emulator = get(cli).emulator;

		if (!emulator) {
			console.error("Emulator not ready");
			return;
		}

		// Before running the command, add an event listener if a callback is needed.
		// To support a callback we'll need to add an end marker and listen to the
		// UART1 port for that marker before we call the callback function.
		if (callbackExercise) {
			command = `(${cmd} && echo ${SANDBOX_END_MARKER}) > ${FILE_EXERCISE_CHECK}\n`;
			let output = "";
			const listener = (byte: number) => {
				const char = String.fromCharCode(byte);
				output += char;
				const indexDoneMarker = output.indexOf(SANDBOX_END_MARKER);
				if (indexDoneMarker > -1) {
					callbackExercise(output.slice(0, indexDoneMarker));
					emulator.remove_listener(BUS_OUTPUT_EXERCISE_CHECK, listener);
				}
			};
			emulator.add_listener(BUS_OUTPUT_EXERCISE_CHECK, listener);
		}

		// Command executed in user's terminal
		if (mode === EXEC_MODE_TERMINAL) {
			chars.forEach((c: number) => emulator.bus.send(BUS_INPUT, c));
		}

		// Command executed on the background, skipping xterm, and not visible to the user
		if (mode === EXEC_MODE_BUS) {
			emulator.keyboard_send_text(command);
		}

		// Command executed in xterm, but not visible to the user. This is useful when you want to
		// run a command that affects the current bash session, but in the background: e.g. running
		// `stty` and defining env variables.
		if (mode === EXEC_MODE_TERMINAL_HIDDEN) {
			// Temporarily remove listeners so the xterm UI doesn't show the command
			emulator.bus.listeners[BUS_OUTPUT] = [];

			// Send command
			chars.forEach((c: number) => emulator.bus.send(BUS_INPUT, c));

			// Bring back listeners after a short delay
			setTimeout(() => {
				emulator.bus.listeners[BUS_OUTPUT] = get(cli).listeners;
			}, 500);
		}
	},

	// List files in a folder recursively (if path is to a file, returns [] if exists, undefined otherwise)
	ls: (path: string): FileInfo[] => {
		const emulator = get(cli).emulator;

		if (!emulator) {
			console.error("Emulator not ready");
			return [];
		}

		// Loop through files in the current folder
		let result: FileInfo[] = [];
		const files = emulator.fs9p.read_dir(path);
		for (const file of files) {
			const filePath = `${path}/${file}`;
			const iNode = emulator.fs9p.SearchPath(filePath);
			const isDir = emulator.fs9p.IsDirectory(iNode.id);
			result.push({ path: filePath, isDir });

			// If it's a folder, run ls on it recursively
			if (emulator.fs9p.IsDirectory(iNode.id)) {
				result = result.concat(get(cli).ls(filePath));
			}
		}

		return result;
	},

	// Mount a File object or URL to the file system
	mountFile: async (path: string, file: File | string): Promise<string> => {
		let fileObject: File | Blob;
		let fileName: string;

		if (typeof file === "string") {
			const url = file;
			const blob = await fetch(url).then((d) => d.blob());
			fileObject = blob;
			fileName = url.split("/").pop() || "unknown";
		} else {
			fileObject = file;
			fileName = file.name;
		}

		const buffer = await fileObject.arrayBuffer();
		const view = new Uint8Array(buffer);
		await get(cli).createFile(`${DIR_TUTORIAL}/${path}`, view);

		return path;
	},

	// Read file from path as Uint8Array
	readFile: async (path: string): Promise<Uint8Array | undefined> => {
		const emulator = get(cli).emulator;
		if (!emulator) {
			console.error("FS not ready yet");
			return;
		}

		// Does file exist?
		const iNode = emulator.fs9p.SearchPath(path);
		if (iNode.id === -1) {
			console.error("File not found");
			return;
		}

		// If we know the file exists but it's empty, v86 incorrectly raises an exception
		try {
			return await emulator.read_file(path);
		} catch (e) {
			if (e instanceof Error && e.message === "File not found") {
				return new Uint8Array(0);
			}
			if (e instanceof Error) {
				console.error(e.message);
			}
		}
	},

	// Create a file, given a path and contents (string or Uint8Array)
	createFile: async (path: string, contents: string | Uint8Array): Promise<void> => {
		const emulator = get(cli).emulator;

		if (!emulator) {
			console.error("Emulator not ready");
			return;
		}

		let buffer: Uint8Array;
		if (contents instanceof Uint8Array) {
			buffer = contents;
		} else {
			buffer = new Uint8Array(contents.length);
			buffer.set(strToChars(contents));
		}

		const folder = path.split("/").slice(0, -1).join("/");
		await get(cli).createFolder(folder);
		await emulator.create_file(path, buffer);
	},

	createFolder: async (path: string): Promise<void> => {
		const emulator = get(cli).emulator;

		if (!emulator) {
			console.error("Emulator not ready");
			return;
		}

		// Create all sub-folders needed to store this file. Not using `cli.exec(mkdir, true)`
		// since we currently can't tell when a command is done running.
		let currPath = "";
		const pathElements = path.split("/");
		for (const element of pathElements) {
			currPath += `${element}/`;

			// If folder doesn't exist, create it
			const iNode = emulator.fs9p.SearchPath(currPath);
			if (iNode.id === -1) {
				emulator.fs9p.CreateDirectory(element, iNode.parentid);
			}
		}
	},

	// Clear file system cache
	clearCache: async (): Promise<void> => {
		get(cli).exec("sync; echo 3 >/proc/sys/vm/drop_caches", { mode: EXEC_MODE_BUS });
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
});
