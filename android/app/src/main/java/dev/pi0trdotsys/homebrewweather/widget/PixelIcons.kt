package dev.pi0trdotsys.homebrewweather.widget

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint

/**
 * Direct Kotlin port of src/components/PixelIcon.tsx — same 16x16 character
 * grids and the same color map, rendered into a chunky, nearest-neighbor
 * scaled Bitmap instead of a CSS grid of divs.
 */
object PixelIcons {

    val ICONS: Map<String, List<String>> = mapOf(
        "sun" to listOf(
            "................",
            "......YYYY......",
            "..Y...YYYY...Y..",
            ".YY..YYYYYY..YY.",
            "..Y.YYYYYYYY.Y..",
            "....YYYYYYYY....",
            "..YYYYYYYYYYYY..",
            "YYYYYYYYYYYYYYYY",
            "YYYYYYYYYYYYYYYY",
            "..YYYYYYYYYYYY..",
            "....YYYYYYYY....",
            "..Y.YYYYYYYY.Y..",
            ".YY..YYYYYY..YY.",
            "..Y...YYYY...Y..",
            "......YYYY......",
            "................",
        ),
        "moon" to listOf(
            "................",
            "......WWWW......",
            "....WWWWWWWW....",
            "...WWWWWDDDDW...",
            "..WWWWWDD..DDW..",
            "..WWWWWD....DW..",
            ".WWWWWWD....DW..",
            ".WWWWWWWDDDDW...",
            ".WWWWWWWWWWW....",
            ".WWWWWWWWWW.....",
            "..WWWWWWWW......",
            "..WWWWWWWW......",
            "...WWWWWW.......",
            "....WWWW........",
            "................",
            "................",
        ),
        "partly" to listOf(
            "................",
            ".....YYYY.......",
            "..Y..YYYY..Y....",
            "...YYYYYYY......",
            "..YYYYYYYYYY....",
            "..YYYY.WWWWWW...",
            "....Y.WWWWWWWW..",
            "....WWWWWWWWWWW.",
            "..WWWWWWWWWWWWWW",
            ".WWWWWWWWWWWWWWW",
            ".WWWWWWWWWWWWWW.",
            "..WWWWWWWWWWWW..",
            "................",
            "................",
            "................",
            "................",
        ),
        "cloud" to listOf(
            "................",
            "................",
            ".....WWWWW......",
            "...WWWWWWWWW....",
            "..WWWWWWWWWWW...",
            ".WWWWWWWWWWWWW..",
            "WWWWWWWWWWWWWWW.",
            "WWWWWWWWWWWWWWWW",
            "WWWWWWWWWWWWWWWW",
            ".WWWWWWWWWWWWWW.",
            "..WWWWWWWWWWWW..",
            "....WWWWWWWW....",
            "................",
            "................",
            "................",
            "................",
        ),
        "fog" to listOf(
            "................",
            "................",
            "..GGGGGGGGGGGG..",
            "...GGGGGGGGGG...",
            "................",
            ".GGGGGGGGGGGGGG.",
            "..GGGGGGGGGGGG..",
            "................",
            "GGGGGGGGGGGGGGGG",
            "..GGGGGGGGGGGG..",
            "................",
            ".GGGGGGGGGGGGGG.",
            "...GGGGGGGGGG...",
            "................",
            "..GGGGGGGGGGGG..",
            "................",
        ),
        "rain" to listOf(
            "................",
            "....WWWWWW......",
            "..WWWWWWWWWW....",
            ".WWWWWWWWWWWWW..",
            "WWWWWWWWWWWWWWW.",
            "WWWWWWWWWWWWWWWW",
            ".WWWWWWWWWWWWWW.",
            "..WWWWWWWWWWWW..",
            "................",
            "..B..B..B..B..B.",
            ".B..B..B..B..B..",
            "..B..B..B..B..B.",
            ".B..B..B..B..B..",
            "..B..B..B..B..B.",
            "................",
            "................",
        ),
        "snow" to listOf(
            "................",
            "....WWWWWW......",
            "..WWWWWWWWWW....",
            ".WWWWWWWWWWWWW..",
            "WWWWWWWWWWWWWWW.",
            "WWWWWWWWWWWWWWWW",
            ".WWWWWWWWWWWWWW.",
            "..WWWWWWWWWWWW..",
            "................",
            "..S....S....S...",
            ".SSS..SSS..SSS..",
            "..S....S....S...",
            "....S....S....S.",
            "...SSS..SSS..SSS",
            "....S....S....S.",
            "................",
        ),
        "thunder" to listOf(
            "................",
            "....DDDDDD......",
            "..DDDDDDDDDD....",
            ".DDDDDDDDDDDDD..",
            "DDDDDDDDDDDDDDD.",
            "DDDDDDDDDDDDDDDD",
            ".DDDDDDDDDDDDDD.",
            "..DDDDDDDDDDDD..",
            "................",
            ".....LLLL.......",
            "....LLLL........",
            "...LLLLLLLL.....",
            ".....LLLL.......",
            "....LLL.........",
            "...LL...........",
            "................",
        ),
    )

    private val COLORS: Map<Char, Int> = mapOf(
        'Y' to Color.parseColor("#ffd23f"),
        'W' to Color.parseColor("#e0e6e0"),
        'G' to Color.parseColor("#4a6a4a"),
        'D' to Color.parseColor("#2a3a2a"),
        'B' to Color.parseColor("#55aaff"),
        'C' to Color.parseColor("#55ffff"),
        'K' to Color.parseColor("#000000"),
        'L' to Color.parseColor("#ffb000"),
        'S' to Color.parseColor("#e0f0ff"),
    )

    private const val BLANK_ROW = "................"

    /** The rows below the cloud body where rain/snow precipitation pixels
     * live (see the "rain"/"snow" grids above) — everything from just below
     * the cloud body to the bottom edge of the 16-row grid. */
    private const val PRECIP_BAND_START = 9
    private const val PRECIP_BAND_END = 15

    /** Sun-ray-tip cells (row, col) — the isolated 'Y' pixels furthest from
     * the core disc (the diagonal/corner ray tips), dropped on the
     * "retracted" twinkle frame. Hand-picked once against the "sun" grid
     * above since they're inherently specific to that grid's exact shape. */
    private val SUN_RAY_TIPS: List<Pair<Int, Int>> = listOf(
        2 to 2, 2 to 13,
        3 to 1, 3 to 2, 3 to 13, 3 to 14,
        4 to 2, 4 to 13,
        11 to 2, 11 to 13,
        12 to 1, 12 to 2, 12 to 13, 12 to 14,
        13 to 2, 13 to 13,
    )

    /** 4-frame vertical-bob offset cycle (source-grid pixels) used by the
     * static-shaped kinds (cloud/partly/fog/moon): 0, -1, 0, +1. */
    private val BOB_OFFSETS = intArrayOf(0, -1, 0, 1)

    /** Shifts the rows in [start..end] (inclusive) of [grid] down by [shift]
     * rows, wrapping within that band only — used for the falling-rain /
     * drifting-snow effect. Rows outside the band are returned untouched. */
    private fun shiftBand(grid: List<String>, start: Int, end: Int, shift: Int): List<String> {
        val bandSize = end - start + 1
        val band = grid.subList(start, end + 1)
        val shifted = (0 until bandSize).map { i ->
            val srcIdx = ((i - shift) % bandSize + bandSize) % bandSize
            band[srcIdx]
        }
        return grid.subList(0, start) + shifted + grid.subList(end + 1, grid.size)
    }

    /** Shifts the whole 16-row grid up/down by [offset] rows; rows that would
     * land outside 0..15 are simply left blank rather than wrapping. */
    private fun shiftRows(grid: List<String>, offset: Int): List<String> =
        (0 until grid.size).map { i ->
            val src = i - offset
            if (src in grid.indices) grid[src] else BLANK_ROW
        }

    /** Returns [grid] with the given (row, col) cells blanked out. */
    private fun blankCells(grid: List<String>, cells: List<Pair<Int, Int>>): List<String> {
        val byRow = cells.groupBy({ it.first }, { it.second })
        return grid.mapIndexed { rowIdx, row ->
            val cols = byRow[rowIdx] ?: return@mapIndexed row
            val chars = row.toCharArray()
            cols.forEach { c -> if (c in chars.indices) chars[c] = '.' }
            String(chars)
        }
    }

    /** Returns [grid] with every occurrence of [ch] replaced by '.'. */
    private fun blankChar(grid: List<String>, ch: Char): List<String> =
        grid.map { row -> row.replace(ch, '.') }

    /**
     * Applies this render's per-frame animation transform to the base 16x16
     * grid for [kind]. Frame count/cadence is deliberately small (2-4) and
     * driven by the ~60s BlinkAlarm tick (see WeatherWidgetProvider /
     * BlinkAlarm.kt) rather than any smooth/continuous animation.
     */
    private fun transformGrid(kind: String, grid: List<String>, frame: Int): List<String> {
        val f = ((frame % 4) + 4) % 4
        return when (kind) {
            // Falling rain / drifting snow: shift only the precip band down
            // one row per frame, wrapping within that band. Cloud-body rows
            // above the band are part of the untouched prefix and never move.
            "rain", "snow" -> shiftBand(grid, PRECIP_BAND_START, PRECIP_BAND_END, f)
            // Twinkle: alternate full rays / retracted rays every other frame.
            "sun" -> if (f % 2 == 1) blankCells(grid, SUN_RAY_TIPS) else grid
            // Flash: alternate the lightning bolt on/off every other frame;
            // the storm-cloud body ('D' pixels) is untouched.
            "thunder" -> if (f % 2 == 1) blankChar(grid, 'L') else grid
            // Gentle 1px vertical bob over a 4-frame cycle (0, -1, 0, +1).
            "cloud", "partly", "fog", "moon" -> shiftRows(grid, BOB_OFFSETS[f])
            else -> grid
        }
    }

    /**
     * Renders a 16x16 pixel-icon "kind" into a chunky bitmap of [finalSize]x[finalSize]
     * pixels (default 96), each source pixel drawn as a filled, non-antialiased
     * rect so the result stays crisp/pixelated like the web CSS-grid version.
     *
     * [frame] selects a subtle per-kind animation frame (see [transformGrid]),
     * advanced roughly once a minute by the widget's existing blink tick —
     * there is no new alarm/timer here, this just reads whatever frame value
     * was last persisted.
     */
    fun render(kind: String, finalSize: Int = 96, frame: Int = 0): Bitmap {
        val baseGrid = ICONS[kind] ?: ICONS.getValue("cloud")
        val grid = transformGrid(kind, baseGrid, frame)
        val bmp = Bitmap.createBitmap(finalSize, finalSize, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val paint = Paint().apply {
            isAntiAlias = false
            isFilterBitmap = false
            style = Paint.Style.FILL
        }
        val px = finalSize / 16f
        for (y in grid.indices) {
            val row = grid[y]
            for (x in row.indices) {
                val ch = row[x]
                if (ch == '.') continue
                val color = COLORS[ch] ?: Color.parseColor("#33ff66")
                paint.color = color
                val left = x * px
                val top = y * px
                canvas.drawRect(left, top, left + px + 0.5f, top + px + 0.5f, paint)
            }
        }
        return bmp
    }
}
