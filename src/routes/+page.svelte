<script>
    import Terminal from '$components/Terminal.svelte';



    const links = [
        {
            name: 'WebR',
            description: 'R running in the browser via WebAssembly to perform bioinformatics analyses',
            link: 'https://wasmodic.github.io/webr/'
        },
        {
            name: 'Pyscript Exercise',
            description: 'PyScript makes it easy to create rich Python applications in the browser using HTML components', 
            link: 'https://wasmodic.github.io/pyscript/'
        },
        {
            name: 'Pyodide',
            description: 'Python running in the browser via WebAssembly to perform bioinformatics analyses',
            link: 'https://wasmodic.github.io/pyodide/'
        },
        {
            name: 'JupyterLite',
            description: 'JupyterLab running entirely in the browser using WebAssembly for a rich interactive computing experience',
            link: 'https://wasmodic.github.io/jupyterlite/'
        },
        {
            name: 'ShinyLive',
            description: 'Run R/Python Shiny applications entirely in the browser using WebAssembly',
            link: 'https://shinylive.io/py/app/#gist=145aeacadb9bfe52ea708c6a0574f9a4'
        },
		{
            name: 'Compiled Rust Exercise',
            description: 'Compiling Rust to run in Wasm',
            link: ''
        }
        
    ];
    const tableData = [
        { name: 'Introduction to WebAssembly', presenter: 'Wytamma Wirth', time: '1:30 - 1:40 PM' },
        { name: 'History of WebAssembly', presenter: 'Torsten Seemann', time: '1:40 - 1:55 PM' },
        { name: 'Intro to Web Development', presenter: 'Leo Featherstone', time: '1:55 - 2:05 PM' },
        { name: 'Bioinformatics Use Cases for WebAssembly', presenter: 'Wytamma Wirth', time: '2:05 - 2:25 PM' },
        { name: 'Practical Walkthrough: Compiling Rust to Biowasm' , presenter: 'Andrew Lonsdale', time: '2:25 - 2:40 PM' },
        { name: 'Hackathon Explanation and Setup', presenter: 'Wytamma Wirth', time: '2:40 - 3:00 PM' },
        { name: 'Break', presenter: '', time: '3:00 - 3:30 PM' },
        { name: 'Hackathon Time', presenter: 'All Participants', time: '3:30 - 5:00 PM' }
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
        

    <div class="card preset-filled-surface-100-900 border border-surface-200-800 divide-surface-200-800 divide-y">
        <!-- Terminal Content -->
        <article class="p-0 bg-black min-h-96">
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

    <h2 class="h4 mt-8">Demo Links</h2>
    <p class="mt-2">Explore these WebAssembly-based demos that run entirely in your browser (<a href="https://github.com/orgs/wasmodic/repositories" class="underline"
        >templates on github</a>)</p>
     <!-- Demo Links Grid -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 mb-8">
        {#each links as link}
            <a href={link.link} target="_blank" rel="noopener noreferrer" class="card preset-tonal hover:preset-filled transition-all duration-200 p-6 space-y-2 group">
                <h3 class="h4 group-hover:underline">{link.name}</h3>
                <p class="opacity-70">{link.description}</p>
            </a>
        {/each}
    </section>
    <h2 class="h4 mt-8">Workshop Schedule</h2>
    <div class="table-wrap">
        <table class="table caption-bottom">
            <!-- <caption class="pt-4">We reserve the right to adapt or change the schedule at runtime</caption> -->
            <thead >
                <tr>
                    <th>Section</th>
                    <th>Presenter</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody class="[&>tr]:hover:preset-tonal-primary">
                {#each tableData as row}
                    <tr>
                        <td>{row.name}</td>
                        <td>{row.presenter}</td>
                        <td>{row.time}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <h2 class="h4 mt-8">Resources</h2>
    <p class="mt-2">Here are some useful resources to get started with WebAssembly in bioinformatics:</p>
    <ul class="list-disc list-inside mt-4 space-y-2">
        <li><a class="underline" href="https://webassembly.org/">WebAssembly Official Site</a></li>
        <li><a class="underline" href="https://emscripten.org/">Emscripten Documentation</a></li>
       <li><a class="underline" href="https://biowasm.com/">Biowasm Overview</a></li>
       <li><a class="underline" href="https://docs.r-wasm.org/webr/latest/">WebR Documnetation</a></li>
	       <li><a class="underline" href="https://docs.pyscript.net/2025.11.2/">PyScript Documentation</a></li>
	       <li><a class="underline" href="https://pyodide.org/en/stable/">Pyodide Documentation</a></li>
	       <li><a class="underline" href="https://jupyterlite.readthedocs.io/en/stable/">JupyterLite Documentation</a></li>
	       <li><a class="underline" href="https://posit-dev.github.io/r-shinylive/">Shinylive R Documentation</a></li>
	       <li><a class="underline" href="https://shiny.posit.co/py/get-started/shinylive.html">Shinylive R Documentation</a></li>

     
 
    </ul>

</main>
