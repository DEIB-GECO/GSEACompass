# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

# Force PyInstaller to output directly into your expected backend_src/dist folder
DISTPATH = 'backend_src/dist'

# Grab all the hidden HTML/JS templates required by pyvis
pyvis_templates = collect_data_files('pyvis')

# 1. Define all your individual backend scripts
scripts = [
    "gsea", 
    "gsea_preranked", 
    "ssgsea", 
    "gsva", 
    "gsea_plot", 
    "gene_set_info"
]

exes = []
analyses = []

# 2. Create an Analysis and EXE block for each script dynamically
for script in scripts:
    a = Analysis(
        [f"backend_src/{script}.py"],
        pathex=["backend_src"],
        binaries=[],
        datas=pyvis_templates, # <-- Added the pyvis templates here!
        hiddenimports=['matplotlib.backends.backend_pdf', 'matplotlib.backends.backend_svg'],
        hookspath=[],
        hooksconfig={},
        runtime_hooks=[],
        excludes=["nvidia"], 
        noarchive=False,
    )
    analyses.append(a)
    
    pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
    
    exe = EXE(
        pyz,
        a.scripts,
        [],
        exclude_binaries=True,
        name=script, 
        debug=False,
        bootloader_ignore_signals=False,
        strip=False,
        upx=True,
        console=True,
        disable_windowed_traceback=False,
        argv_emulation=False,
        target_arch=None,
        codesign_identity=None,
        entitlements_file=None,
    )
    exes.append(exe)

# 3. Collect ALL of the generated EXEs and their dependencies into ONE shared folder
collect_args = []
for i in range(len(scripts)):
    collect_args.extend([exes[i], analyses[i].binaries, analyses[i].zipfiles, analyses[i].datas])

coll = COLLECT(
    *collect_args,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='backend'
)