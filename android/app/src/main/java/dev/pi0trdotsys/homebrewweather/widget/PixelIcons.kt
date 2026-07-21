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

    /**
     * Renders a 16x16 pixel-icon "kind" into a chunky bitmap of [finalSize]x[finalSize]
     * pixels (default 96), each source pixel drawn as a filled, non-antialiased
     * rect so the result stays crisp/pixelated like the web CSS-grid version.
     */
    fun render(kind: String, finalSize: Int = 96): Bitmap {
        val grid = ICONS[kind] ?: ICONS.getValue("cloud")
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
