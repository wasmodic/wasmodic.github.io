<script>
    import Terminal from '$components/Terminal.svelte';

    const demos = [
        {
            name: 'JupyterLite',
            description: 'JupyterLab running entirely in the browser using WebAssembly',
            link: 'https://wasmodic.github.io/jupyterlite/'
        },
        {
            name: 'Pyodide',
            description: 'Python running in the browser via WebAssembly',
            link: 'https://pyodide.org/en/stable/'
        },
        {
            name: 'WebR',
            description: 'R running in the browser via WebAssembly',
            link: 'https://wasmodic.github.io/webr/'
        },
        {
            name: 'Pyscript',
            description: 'PyScript makes it easy to create rich Python applications in the browser using HTML components', 
            link: 'https://wasmodic.github.io/pyscript/'
        },
        {
            name: 'Biowasm',
            description: 'A collection of bioinformatics tools compiled to WebAssembly',
            link: 'https://biowasm.com/'
        },
        {
            name: 'ShinyLive',
            description: 'Run R Shiny applications entirely in the browser using WebAssembly',
            link: 'https://wasmodic.github.io/shinylive/'
        }
        
    ];
</script>

<svelte:head>
    <title>Terminal</title>
</svelte:head>

<main class="container mx-auto p-4">
        <!-- Header -->
    <header class="py-6 space-y-2">
        <h2 class="h6 opacity-60"><a class="hover:underline"
             href="https://www.abacbs.org/abacbs2025">ABACBS 2025</a></h2>
        <h3 class="h3">Client-side Bioinformatics</h3>
        <h4 class=" text-lg italic">Building bioinformatics tools for the browser with WebAssembly</h4>
    </header>
        

    <div class="card preset-filled-surface-100-900 border border-surface-200-800 divide-surface-200-800 divide-y overflow-hidden">
        <!-- Terminal Content -->
        <article class="p-0">
            <Terminal
                on:status={(event) => (console.log('Terminal status:', event.detail))}
                tools={['csvtk']}
            />
        </article>
        
        <!-- Footer -->
        <footer class="flex items-center justify-between gap-4 p-4">
            <small class="opacity-60">Modified from <a 
                class="underline"
                href="https://sandbox.bio">sandbox.bio</a></small>
            <small class="opacity-60">ABACBS Wasm Workshop</small>
        </footer>
    </div>

     <!-- Demo Links Grid -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-8">
        {#each demos as demo}
            <a href={demo.link} target="_blank" rel="noopener noreferrer" class="card preset-tonal hover:preset-filled transition-all duration-200 p-6 space-y-2 group">
                <h3 class="h4 group-hover:underline">{demo.name}</h3>
                <p class="opacity-70">{demo.description}</p>
            </a>
        {/each}
    </section>
</main>