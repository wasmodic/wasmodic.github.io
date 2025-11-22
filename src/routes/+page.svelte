<script>
    import Terminal from '$components/Terminal.svelte';

    
const references = [
        {
            name: 'WebAssembly (Wasm)',
            description: 'The instruction format for a stack-based virtual machine',
            link: 'https://webassembly.org/'
        },{
            name: 'Emscripten',
            description: 'Compiler toolchain to WebAssembly',
            link: 'https://emscripten.org/'
        },
        
        
    ];

const examples = [
        {
            name: 'Pyodide Homepage',
            description: 'Python running in the browser via WebAssembly',
            link: 'https://pyodide.org/en/stable/'
        },
		{
            name: 'Biowasm Overview',
            description: 'A collection of bioinformatics tools compiled to WebAssembly',
            link: 'https://biowasm.com/'
        },
		{
            name: 'WebR Documentation',
            description: 'R compiled for the browser and Node.js using WebAssembly, via Emscripten',
            link: 'https://docs.r-wasm.org/webr/latest/'
        },

       
    ];


    const links = [
        {
            name: 'JupyterLite Exercise',
            description: 'JupyterLab running entirely in the browser using WebAssembly',
            link: 'https://wasmodic.github.io/jupyterlite/'
        },
{
            name: 'BioWasm Exercise',
            description: '',
            link: 'https://blog.wytamma.com/embl-ebi-muscle-wasm/'
        },
        {
            name: 'WebR Exercise',
            description: 'R running in the browser via WebAssembly',
            link: 'https://wasmodic.github.io/webr/'
        },
        {
            name: 'Pyscript Exercise',
            description: 'PyScript makes it easy to create rich Python applications in the browser using HTML components', 
            link: 'https://wasmodic.github.io/pyscript/'
        },
        {
            name: 'ShinyLive Exercise',
            description: 'Run R/Python Shiny applications entirely in the browser using WebAssembly',
            link: 'https://shinylive.io/py/app/#gist=145aeacadb9bfe52ea708c6a0574f9a4'
        },
		{
            name: 'Compiled Rust Exercise',
            description: 'Compiling Rust to run in Wasm',
            link: ''
        }
        
    ];

</script>

<svelte:head>
    <title>Client-side Bioinformatics</title>
</svelte:head>

<main class="container mx-auto p-4">
        <!-- Header -->
    <header class="py-6 space-y-2">
        <h2 class="h6 opacity-60"><a class="hover:underline"
             href="https://www.abacbs.org/abacbs2025">ABACBS 2025</a></h2>
        <h3 class="h3">Client-side Bioinformatics</h3>
        <h4 class=" text-lg italic">Building bioinformatics tools for the browser with WebAssembly</h4>
    </header>
        

    <div class="card preset-filled-surface-100-900 border border-surface-200-800 divide-surface-200-800 divide-y overflow-hidden ">
        <!-- Terminal Content -->
        <article class="p-0 bg-black">
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

        <h4 class="h4">Practical Exercises</h4>

     <!-- Demo Links Grid -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-8">
        {#each links as link}
            <a href={link.link} target="_blank" rel="noopener noreferrer" class="card preset-tonal hover:preset-filled transition-all duration-200 p-6 space-y-2 group">
                <h3 class="h4 group-hover:underline">{link.name}</h3>
                <p class="opacity-70">{link.description}</p>
            </a>
        {/each}
    </section>
        <h4 class="h4">References</h4>

  <!-- Reference Links Grid -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-8">
        {#each examples as link}
            <a href={link.link} target="_blank" rel="noopener noreferrer" class="card preset-tonal-primary hover:preset-filled-{color}-{lightModeShade} transition-all duration-200 p-6 space-y-2 group">
                <h3 class="h4 group-hover:underline">{link.name}</h3>
                <p class="opacity-70">{link.description}</p>
            </a>
        {/each}
    </section>
  <!-- Examples Links Grid -->
        <h4 class="h4">References</h4>

    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-8">
        {#each references as link}
            <a href={link.link} target="_blank" rel="noopener noreferrer" class="card preset-tonal-secondary hover:preset-filled-{color}-{lightModeShade} transition-all duration-200 p-6 space-y-2 group">
                <h3 class="h4 group-hover:underline">{link.name}</h3>
                <p class="opacity-70">{link.description}</p>
            </a>
        {/each}
    </section>
</main>
