# Bug report: Unity WebGL build crashes with `abort("OOM")` after sustained interaction

**Component:** `Generation_Tree` Unity WebGL build (company `iii`)
**Where it's embedded:** Angular app, `unity-container.component.ts` (loads `assets/unity/Build/Build.*.unityweb`)
**Severity:** High — crashes the 3D family tree for end users after some time interacting.

---

## Symptom

After interacting with the 3D tree for a while (memory grows with each operation),
the browser shows:

```
An error occurred running the Unity content on this page.
The error was: abort("OOM") at Error
    at jsStackTrace
    at stackTrace
    at abort
    at abortOnCannotGrowMemory
    at _emscripten_resize_heap
    at wasm://wasm/0e7df4a6:wasm-function[...]
    ...
```

The Unity content then dies and the canvas is unrecoverable until reload.

## Root cause (confirmed from the shipped build, not a guess)

This is the **WebAssembly linear-memory heap** running out of room, not the JS
heap. Decompiling the shipped `Build.framework.js.unityweb` shows:

- `_emscripten_resize_heap(requestedSize)` aborts when
  `requestedSize > getHeapMax()`.
- `getHeapMax()` returns **`2147418112`** bytes ≈ **2 GB**, which is the
  **maximum addressable memory for 32-bit WebGL (`wasm32`)** in a browser.
- `wasmMemory = Module["asm"]["oj"]` — the memory object is **exported from
  inside `Build.wasm.unityweb`**, so its initial/maximum size is baked into the
  wasm binary at build time.

**Implications:**
- The build is *already at the hardware/browser ceiling.* The maximum cannot be
  raised from the web app, the Unity loader config, or any browser flag. The
  `initialMemory` / `maximumMemory` options that were set in JS are ignored by
  this build (the loader/framework never read them).
- Because the content reaches ~2 GB only after sustained interaction (and memory
  in wasm only ever grows, never shrinks), this is a **memory leak / unbounded
  growth in the Unity content**, not a one-time spike.

## What this means for whoever owns the Unity project

The fix must happen in the Unity project source — it is not addressable from the
embedding Angular app. Two workstreams:

### 1. Stop the growth (the actual bug)
Use the **Unity Memory Profiler** and capture two snapshots: one at startup and
one after repeatedly performing the interaction that grows memory (e.g. clicking
nodes / opening connections). Diff them. Likely culprits given the "grows per
operation" symptom:
- `Instantiate(...)` of GameObjects/prefabs per interaction without a matching
  `Destroy(...)`.
- Textures / `RenderTexture` / `Material` / `Mesh` created at runtime and never
  released (these are *not* GC-managed — they leak until explicitly destroyed).
- Event/`Action`/delegate subscriptions added on each interaction and never
  removed (keeps objects alive).
- Growing `List`/`Dictionary`/cache that is never trimmed.
- UI elements or line/edge renderers rebuilt without clearing the old ones.

After tearing down a view (e.g. closing a detail panel or rebuilding the tree),
call:
```csharp
Resources.UnloadUnusedAssets();
System.GC.Collect();
```

### 2. Lower the baseline (buys headroom)
Even after the leak is fixed, reducing the resident footprint keeps users far
from the 2 GB wall:
- Texture import: ASTC/Crunch compression, lower **Max Size**, disable
  mipmaps where not needed.
- Mesh compression / read-write disabled on static meshes.
- Audio: "Compressed In Memory" or "Streaming" instead of "Decompress On Load".
- Player settings: IL2CPP + **Strip Engine Code** / Managed Stripping Level High.
- Address `WebGLMemorySize` / "Memory Growth" build settings — growth is already
  enabled (it grows until 2 GB), so the lever is reducing demand, not the cap.

### Note: 2 GB is a hard wall
`wasm32` cannot exceed ~2 GB in current browsers. If the scene genuinely needs
more than 2 GB at peak, the only structural options are (a) reduce what's loaded
at once (stream / LOD / unload off-screen parts of the tree), or (b) a future
move to wasm64 / memory64, which Unity WebGL does not support in a stable build
today.

## Secondary symptom: `RuntimeError: memory access out of bounds`

Some sessions trap with `memory access out of bounds` (a wasm bounds trap)
instead of the clean `abort("OOM")`:

```
RuntimeError: memory access out of bounds
    at 0e7df4a6:0xe1065
    at 0e7df4a6:0x294dced
    at 0e7df4a6:0x19e800
    at 0e7df4a6:0xdd2b3
    ...
    at browserIterationFunc / Browser_mainLoop_runner   (per-frame main loop)
```

The deepest frames (`0x294dced`, `0x19e800`, `0xdd2b3`, `0x275c358`,
`0x2a85e0f`, `0x2a9aa5d`, `0x4dda4d`, `0x17e99f4`, `0x29b40d4`) are the **same
wasm functions** seen in the `abort("OOM")` stack — i.e. the same
allocation/heap-growth path, hit from the regular per-frame update loop. The
most likely reading is that this is the OOM condition surfacing as a bounds trap
when a heap grow fails mid-operation.

**However**, an out-of-bounds trap can also be genuine memory *corruption*
(use-after-free, an out-of-range index, a bad pointer in a native plugin),
independent of exhaustion. To disambiguate, please reproduce with a **Development
Build** (Player Settings → Development Build / "Full With Stacktrace" exceptions,
and IL2CPP exception support). That replaces the raw addresses with real C#
stack frames and adds bounds checks, which will point straight at the offending
call site.

## What was already done on the web side (for context)

The Angular embedding was improved separately (PR on `claude/relaxed-brahmagupta-jw60b2`):
caching the build in IndexedDB, capping `devicePixelRatio` to reduce in-browser
lag, fixing JS-side dialog/subscription leaks, and running Unity's main loop
outside Angular's change-detection zone (its per-frame loop was triggering a full
Angular change-detection pass every frame — a major perf drain). **None of these
can prevent the wasm OOM** — they address performance and the JS heap only. The
crash above is purely a function of the Unity content's memory use.

## Minimal repro
1. Load the app, open the 3D tree.
2. Repeatedly click nodes / open connection details for a few minutes.
3. Watch `unityInstance.Module.HEAP8.length` (or the browser task-manager memory)
   climb monotonically toward ~2 GB.
4. At the ceiling, `abort("OOM")` fires.
