<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ((int) session('emp_data.emp_id') !== 0) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
