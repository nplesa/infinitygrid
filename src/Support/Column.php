<?php

namespace nplesa\InfinityGrid\Support;

class Column
{
    public $field;
    public $label;
    public $sortable = false;
    public $filter = null;

    public function __construct($field, $label)
    {
        $this->field = $field;
        $this->label = $label;
    }

    public static function make($field, $label)
    {
        return new self($field, $label);
    }

    public function sortable()
    {
        $this->sortable = true;
        return $this;
    }

    public function filter(array $options)
    {
        $this->filter = $options;
        return $this;
    }
}
