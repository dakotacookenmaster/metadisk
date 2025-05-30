import splitIntoBytes from "../../common/helpers/splitIntoBytes"
import Editor from "@monaco-editor/react"
import { useEffect, useRef } from "react"
import { chunk } from "lodash"
import { Typography } from "@mui/material"
import * as monacoEditor from "monaco-editor"
import { css } from "@emotion/css"

export const characterMap = [
    "\uE400",
    "\u263A",
    "\u263B",
    "\u2665",
    "\u2666",
    "\u2663",
    "\u2660",
    "\u2022",
    "\u25D8",
    "\u25CB",
    "\u25D9",
    "\u2642",
    "\u2640",
    "\u266A",
    "\u266B",
    "\u263C",
    "\u25BA",
    "\u25C4",
    "\u2915",
    "\u203C",
    "\u00B6",
    "\u00A7",
    "\u25AC",
    "\u21A8",
    "\u2191",
    "\u2193",
    "\u2192",
    "\u2190",
    "\u221F",
    "\u2194",
    "\u25B2",
    "\u26BC",
    "\u0020",
    "!",
    '"',
    "#",
    "$",
    "%",
    "&",
    "'",
    "(",
    ")",
    "*",
    "+",
    ",",
    "-",
    ".",
    "/",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ":",
    ";",
    "<",
    "=",
    ">",
    "?",
    "@",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "[",
    "\\",
    "]",
    "^",
    "_",
    "`",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "{",
    "|",
    "}",
    "~",
    "\u2302",
    "\u00C7",
    "\u00FC",
    "\u00E9",
    "\u00E2",
    "\u00E4",
    "\u00E0",
    "\u00E5",
    "\u00E7",
    "\u00EA",
    "\u00EB",
    "\u00E8",
    "\u00EF",
    "\u00EE",
    "\u00EC",
    "\u00C4",
    "\u00C5",
    "\u00C9",
    "\u00E6",
    "\u00C6",
    "\u00F4",
    "\u00F6",
    "\u00F2",
    "\u00FB",
    "\u00F9",
    "\u00FF",
    "\u00D6",
    "\u00DC",
    "\u00A2",
    "\u00A3",
    "\u00A5",
    "\u20A7",
    "\u0192",
    "\u00E1",
    "\u00ED",
    "\u00F3",
    "\u00FA",
    "\u00F1",
    "\u00D1",
    "\u00AA",
    "\u00BA",
    "\u00BF",
    "\u2310",
    "\u00AC",
    "\u00BD",
    "\u00BC",
    "\u00A1",
    "\u00AB",
    "\u00BB",
    "\u2591",
    "\u2591",
    "\u2591",
    "\u2502",
    "\u2524",
    "\u2561",
    "\u2562",
    "\u2556",
    "\u2555",
    "\u2563",
    "\u2551",
    "\u2557",
    "\u255D",
    "\u255C",
    "\u255B",
    "\u2510",
    "\u2514",
    "\u2534",
    "\u252C",
    "\u251C",
    "\u2500",
    "\u253C",
    "\u255E",
    "\u255F",
    "\u255A",
    "\u2554",
    "\u2569",
    "\u2566",
    "\u2560",
    "\u2550",
    "\u256C",
    "\u2567",
    "\u2568",
    "\u2564",
    "\u2565",
    "\u2559",
    "\u2558",
    "\u2552",
    "\u2553",
    "\u256B",
    "\u256A",
    "\u2518",
    "\u250C",
    "\u2588",
    "\u2584",
    "\u258C",
    "\u2590",
    "\u2580",
    "\u03B1",
    "\u00DF",
    "\u0393",
    "\u03C0",
    "\u03A3",
    "\u03C3",
    "\u00B5",
    "\u03C4",
    "\u03A6",
    "\u0398",
    "\u03A9",
    "\u03B4",
    "\u221E",
    "\u03C6",
    "\u03B5",
    "\u2229",
    "\u2261",
    "\u00B1",
    "\u2265",
    "\u2264",
    "\u2390",
    "\u2321",
    "\u00F7",
    "\u2248",
    "\u00B0",
    "\u2219",
    "\u00B7",
    "\u221A",
    "\u207F",
    "\u00B2",
    "\u25A0",
    "\u00A0",
]

/**
 * Find the numeric value associated with the given character
 * @param char The character you want to get the number for
 * @returns
 */
export const getCharacterEncoding = (char: string): number => {
    return characterMap.findIndex((c) => c === char)
}

export const getCharacter = (byte: number): string => {
    return characterMap[byte]
}

export const convertBinaryByteStringToType = (
    byte: string,
    mode: "bin" | "hex" | "ascii",
) => {
    if (mode === "ascii") {
        return getCharacter(parseInt(byte, 2))
    } else if (mode === "hex") {
        return parseInt(byte, 2).toString(16).padStart(2, "0").toUpperCase()
    } else {
        return byte
    }
}

// Define types for the highlighting configuration
export type HighlightRange = {
    startRow: number
    startColumn: number
    endRow: number
    endColumn: number
    backgroundColor?: string
    foregroundColor?: string
    label?: string // Text to display as tooltip when hovering
}

export type HighlightConfig = {
    ranges: HighlightRange[]
    repeat?: number
}

const Viewer = (props: {
    data: string
    mode: "bin" | "hex" | "ascii"
    highlights?: HighlightConfig
    shouldHighlight?: boolean
}) => {
    const { data, mode, highlights, shouldHighlight } = props
    const bytes = splitIntoBytes(data)
    const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(
        null,
    )

    const handleMount = (editor: monacoEditor.editor.IStandaloneCodeEditor) => {
        editorRef.current = editor

        if (highlights) {
            applyHighlights(editorRef.current)
        }
    }

    // Helper to apply all highlight decorations
    const applyHighlights = (
        editor: monacoEditor.editor.IStandaloneCodeEditor,
    ) => {
        if (!highlights || !editor) return

        // Clear all previous decorations
        if (editorRef.current?.getModel()) {
            const decorationIds = editorRef.current.getModel()?.getAllDecorations().map(d => d.id) || [];
            editor.removeDecorations(decorationIds);
        }

        if(!shouldHighlight) return

        const decorations: monacoEditor.editor.IModelDeltaDecoration[] = []

        for (const range of highlights.ranges) {
            // Calculate end position considering the mode and spaces

            // Create decoration
            decorations.push({
                // the row needs to be computed
                // because the editor uses 1-based index for lines and columns

                range: new monacoEditor.Range(
                    range.startRow,
                    range.startColumn,
                    range.endRow,
                    range.endColumn,
                ),
                options: {
                    isWholeLine: false,
                    className: css({
                        color: range.foregroundColor || "inherit",
                        backgroundColor: range.backgroundColor || "inherit",
                        borderRadius: "3px",
                    }),
                    hoverMessage: range.label
                        ? { value: range.label }
                        : undefined,
                },
            })
        }

        // Apply all decorations at once
        editor.createDecorationsCollection(decorations)
    }

    const value = chunk(
        bytes.map((byte) => convertBinaryByteStringToType(byte, mode)),
        mode === "ascii" ? 21 : mode === "hex" ? 16 : 4,
    )
        .map((byteGroup) => byteGroup.join(" "))
        .join("\n")

    useEffect(() => {
        if (editorRef.current && highlights) {
            applyHighlights(editorRef.current)
        }
    }, [value, mode, highlights, shouldHighlight])

    return (
        <Editor
            loading={<Typography>Loading...</Typography>}
            height="400px"
            width="100%"
            defaultLanguage="text"
            options={{
                fontSize: 18,
                readOnly: true,
                fontFamily: mode === "ascii" ? "u0000" : "monospace",
                suggestOnTriggerCharacters: false,
                quickSuggestions: false,
                suggest: {
                    showIcons: false,
                    showStatusBar: false,
                },
                glyphMargin: false,
                lineNumbersMinChars: 6,
                selectionHighlight: false, // Disable highlighting of text matches on selection
                occurrencesHighlight: "off", // Disable highlighting all occurrences of the selected word
                lineNumbers: (num: number) => {
                    if (mode === "hex" || mode === "bin") {
                        return ((num - 1) * (mode === "hex" ? 16 : 4))
                            .toString(16)
                            .toUpperCase()
                            .padStart(4, "0")
                    } else {
                        return num.toString()
                    }
                },
            }}
            theme="vs-dark"
            onMount={handleMount}
            value={value}
        />
    )
}

export default Viewer
