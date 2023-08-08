# obsidian-penrose

This is a plugin for making diagrams in Obsidian using [Penrose](https://penrose.cs.cmu.edu/).

_This plugin is currently under development and not published yet._
## Getting Started

* Clone this repository into `.obsidian/plugins` of your vault.
* Run `npm install` in the repo and then `npm run build`.
* Go to "Installed Plugins" and enable `Penrose`.
* For development, use the [hot-reload](https://github.com/pjeby/hot-reload) plugin and `npm run dev` for hot-reloading.

## Example

Currently, the plugin hard-codes the Domain and Style files to be `simple-directed-graph` from [`graph-domain`](https://github.com/penrose/penrose/tree/main/packages/examples/src/graph-domain). The plugin recognizes markdown code blocks with the `penrose` tag and renders diagrams such as: 

````
```penrose
Vertex a, b, c, d

Arc(a, b)
Arc(a, c)
Arc(a, d)
Arc(b, d)
Arc(c, d)

Label a "𝑎"
Label b "𝑏"
Label c "𝑐"
Label d "𝑑"
```
````
