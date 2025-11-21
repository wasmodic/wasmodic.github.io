<script>
    import Terminal from '$components/Terminal.svelte';

    const links = [
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
            description: 'Run R/Python Shiny applications entirely in the browser using WebAssembly',
            link: 'https://shinylive.io/py/app/#gist=145aeacadb9bfe52ea708c6a0574f9a4'
        }
        
    ];

const tableData = [
	{ position: '0', name: 'Iron', symbol: 'Fe', atomic_no: '26' },
	{ position: '1', name: 'Rhodium', symbol: 'Rh', atomic_no: '45' },
	{ position: '2', name: 'Iodine', symbol: 'I', atomic_no: '53' },
	{ position: '3', name: 'Radon', symbol: 'Rn', atomic_no: '86' },
	{ position: '4', name: 'Technetium', symbol: 'Tc', atomic_no: '43' },
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



<table class="min-w-full border divide-y divide-gray-300">
  <thead class="bg-gray-100">
    <tr>
      <th class="px-3 py-2 text-left font-semibold">Gene</th>
      <th class="px-3 py-2 text-left font-semibold">Expression</th>
    </tr>
  </thead>

  <tbody class="divide-y divide-gray-200">
    {#each rows as r}
    <tr>
      <td class="px-3 py-2">{r.gene}</td>
      <td class="px-3 py-2">{r.expr}</td>
    </tr>
    {/each}
  </tbody>
</table>

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
        {#each links as link}
            <a href={link.link} target="_blank" rel="noopener noreferrer" class="card preset-tonal hover:preset-filled transition-all duration-200 p-6 space-y-2 group">
                <h3 class="h4 group-hover:underline">{link.name}</h3>
                <p class="opacity-70">{link.description}</p>
            </a>
        {/each}
    </section>
</main>
