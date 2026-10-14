<?php
// Minimal PDF writer — enough for invoices and shipping labels without any
// external library. Produces valid PDF 1.4 with Helvetica text, filled
// rectangles and lines. Coordinates passed to text()/rect() are measured
// from the TOP-LEFT of the page (like HTML), which keeps layout code sane.
class MiniPdf
{
    const PAGE_W = 595.28; // A4 portrait in points
    const PAGE_H = 841.89;

    private $pages = [];      // each page: list of raw content-stream ops
    private $pageOpen = false;

    public function addPage()
    {
        $this->pages[] = '';
        $this->pageOpen = true;
    }

    private function &currentStream()
    {
        if (!$this->pageOpen) {
            $this->addPage();
        }
        $i = count($this->pages) - 1;
        return $this->pages[$i];
    }

    // Filled rectangle: x,y from top-left, w/h in points
    public function rect($x, $yTop, $w, $h, $r, $g, $b)
    {
        $y = self::PAGE_H - $yTop - $h;
        $s = & $this->currentStream();
        $s .= sprintf("%.3f %.3f %.3f rg %.2f %.2f %.2f %.2f re f\n", $r, $g, $b, $x, $y, $w, $h);
        return $this;
    }

    public function line($x1, $y1Top, $x2, $y2Top, $width = 0.6, $r = 0.8, $g = 0.8, $b = 0.8)
    {
        $y1 = self::PAGE_H - $y1Top;
        $y2 = self::PAGE_H - $y2Top;
        $s = & $this->currentStream();
        $s .= sprintf("%.3f %.3f %.3f RG %.2f w %.2f %.2f m %.2f %.2f l S\n", $r, $g, $b, $width, $x1, $y1, $x2, $y2);
        return $this;
    }

    // Left-aligned text. $bold swaps to Helvetica-Bold.
    public function text($x, $yTop, $size, $str, $bold = false, $r = 0.07, $g = 0.09, $b = 0.08)
    {
        $y = self::PAGE_H - $yTop;
        $font = $bold ? '/F2' : '/F1';
        $s = & $this->currentStream();
        $s .= sprintf("BT %.3f %.3f %.3f rg %s %.2f Tf %.2f %.2f Td (%s) Tj ET\n",
            $r, $g, $b, $font, $size, $x, $y, self::escape($str));
        return $this;
    }

    // Right-aligned text (x is the right edge)
    public function textRight($xRight, $yTop, $size, $str, $bold = false, $r = 0.07, $g = 0.09, $b = 0.08)
    {
        $width = self::estimateWidth($str, $size, $bold);
        return $this->text(max(0, $xRight - $width), $yTop, $size, $str, $bold, $r, $g, $b);
    }

    // Rough Helvetica width estimate (~0.52 em average) — good enough for alignment
    private static function estimateWidth($str, $size, $bold)
    {
        return strlen($str) * $size * ($bold ? 0.55 : 0.52);
    }

    private static function escape($str)
    {
        // Strip non-ASCII (standard-14 fonts are Latin) then escape PDF syntax
        $str = preg_replace('/[^\x20-\x7E]/', '', (string)$str);
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $str);
    }

    public function output()
    {
        $objects = [];
        $objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";

        $kids = [];
        $objNum = 3;
        $pageObjNums = [];
        foreach ($this->pages as $stream) {
            $kids[] = "$objNum 0 R";
            $pageObjNums[] = $objNum;
            $objNum += 2; // page + its content stream
        }
        $objects[2] = "<< /Type /Pages /Kids [" . implode(' ', $kids) . "] /Count " . count($kids) . " >>";

        $font1 = $objNum++;
        $font2 = $objNum++;
        $objects[$font1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
        $objects[$font2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

        foreach ($pageObjNums as $idx => $pageNum) {
            $contentNum = $pageNum + 1;
            $objects[$pageNum] = sprintf(
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.2f %.2f] /Resources << /Font << /F1 %d 0 R /F2 %d 0 R >> >> /Contents %d 0 R >>",
                self::PAGE_W, self::PAGE_H, $font1, $font2, $contentNum
            );
            $stream = $this->pages[$idx];
            $objects[$contentNum] = "<< /Length " . strlen($stream) . " >>\nstream\n" . $stream . "endstream";
        }

        ksort($objects);
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $num => $body) {
            $offsets[$num] = strlen($pdf);
            $pdf .= "$num 0 obj\n$body\nendobj\n";
        }
        $xrefPos = strlen($pdf);
        $count = count($objects) + 1;
        $pdf .= "xref\n0 $count\n0000000000 65535 f \n";
        for ($i = 1; $i < $count; $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $pdf .= "trailer\n<< /Size $count /Root 1 0 R >>\nstartxref\n$xrefPos\n%%EOF";
        return $pdf;
    }
}
?>
