<?php

return [

    // ... keep the framework defaults from the generated Laravel app and add:

    'socket' => [
        'url' => env('SOCKET_URL'),
        'secret' => env('SOCKET_SECRET'),
    ],

];
