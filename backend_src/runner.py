import sys

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No script specified.")
        sys.exit(1)

    # Fetch the command
    command = sys.argv[1]

    # Remove the command from the arguments list so the underlying 
    sys.argv.pop(1)

    # Route to the correct script
    if command == "gsea":
        import gsea
    elif command == "gsea_preranked":
        import gsea_preranked
    elif command == "ssgsea":
        import ssgsea
    elif command == "gsva":
        import gsva
    elif command == "gsea_plot":
        import gsea_plot
    elif command == "gene_set_info":
        import gene_set_info
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)