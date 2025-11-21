<script>
    import Terminal from '$components/Terminal.svelte';
</script>

<svelte:head>
    <title>Terminal</title>
</svelte:head>

<main class="container mx-auto p-4 h-screen">
    <div class="card preset-filled-surface-100-900 border border-surface-200-800 divide-surface-200-800 divide-y overflow-hidden">
        <!-- Header -->
        <header class="p-6 space-y-2">
            <h2 class="h6 opacity-60">ABACBS</h2>
            <h3 class="h3">WebAssembly Workshop</h3>
        </header>
        
        <!-- Terminal Content -->
        <article class="p-0">
            <Terminal
                on:status={(event) => (console.log('Terminal status:', event.detail))}
                init={`mkdir -p ~/workshop && cd ~/workshop`}
                tools={['csvtk']}
            />
        </article>
        
        <!-- Footer -->
        <footer class="flex items-center justify-between gap-4 p-4">
            <small class="opacity-60">WASM Workshop</small>
            <small class="opacity-60">On {new Date().toLocaleDateString()}</small>
        </footer>
    </div>
</main>