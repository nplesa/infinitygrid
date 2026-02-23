<?php

namespace nplesa\InfinityGrid\Services;

class GridEngine
{
    public function build(array $records, array $params, string $site, string $url): array
    {
        $filterName        = $params['filterName'] ?? null;
        $filterValue       = $params['filterValue'] ?? "-1";
        $filterTextField   = $params['filterTextField'] ?? null;
        $filterTextValue   = $params['filterTextValue'] ?? null;
        $currentPage       = (int) ($params['page'] ?? 1);
        $size              = (int) ($params['size'] ?? 10);

        if ($filterName) {
            $filterData = $this->getUniqueFilterValues($records, $filterName);
        } else {
            $filterData = [];
        }

        if ($filterValue !== "-1" && $filterName) {
            $records = $this->filterData($records, $filterName, $filterValue);
        }

        if ($filterTextValue) {
            if ($filterTextField === "search-rows-by-tags") {
                $tags = explode(",", json_decode($filterTextValue));
                $records = $this->filterRecordsByTags($records, $tags);
            } else {
                $records = $this->filterColumnsValue($records, $filterTextField, $filterTextValue);
            }
        }

        return $this->paginate(
            $records,
            $currentPage,
            $size,
            $site,
            $url,
            $filterName,
            $filterValue,
            $filterData,
            $filterTextField,
            $filterTextValue
        );
    }

    private function paginate($records, $currentPage, $size, $site, $url, $filterName, $filterValue, $filterData, $filterTextField, $filterTextValue)
    {
        $total = count($records);
        $last  = intval(ceil($total / $size));
        $next  = $currentPage + 1;
        $previous = $currentPage - 1;

        $from = ($currentPage - 1) * $size;
        $to   = min($currentPage * $size - 1, $total - 1);

        return [
            "total" => $total,
            "per_page" => $size,
            "current_page" => $currentPage,
            "last_page" => $last,
            "first_page_url" => $site.$url."?page=1",
            "last_page_url" => $site.$url."?page=".$last,
            "next_page_url" => ($currentPage >= $last) ? null : $site.$url."?page=".$next,
            "prev_page_url" => ($currentPage > 1) ? $site.$url."?page=".$previous : null,
            "path" => $site.$url,
            "from" => $from,
            "to" => $to,
            "data" => array_slice($records, $from, $size),
            "filters" => [
                "name" => $filterName,
                "value" => $filterValue,
                "data" => $filterData,
                "textField" => $filterTextField,
                "textValue" => $filterTextValue
            ]
        ];
    }

    private function getUniqueFilterValues($records, $filterName)
    {
        $values = array_unique(array_map(fn($r) => $r->$filterName ?? null, $records));
        sort($values);
        return array_values(array_filter($values));
    }

    private function filterData($records, $name, $value)
    {
        return array_values(array_filter($records, fn($r) => $r->$name === $value));
    }

    private function filterColumnsValue($records, $cols, $value)
    {
        $cols = is_string($cols) ? explode(",", $cols) : (array)$cols;

        return array_values(array_filter($records, function ($record) use ($cols, $value) {
            $text = '';
            foreach ($cols as $col) {
                if (isset($record->$col)) {
                    $text .= $record->$col;
                }
            }
            return stripos($text, $value) !== false;
        }));
    }

    private function filterRecordsByTags($records, $tags)
    {
        return array_values(array_filter($records, function ($record) use ($tags) {
            if (!$record->tags) return false;

            $decoded = json_decode($record->tags);
            $tagIds = array_map(fn($t) => $t->tagId, $decoded);

            return count(array_intersect($tagIds, $tags)) === count($tags);
        }));
    }
}