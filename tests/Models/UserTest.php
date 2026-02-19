<?php

namespace nplesa\InfinityGrid\Tests\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserTest extends Model
{
    use HasFactory;

    protected $fillable = ['name','email','role','active'];
}
