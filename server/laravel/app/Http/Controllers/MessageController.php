<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    public function index()
    {
        $messages = Message::with('user:id,name')
            ->latest()
            ->limit(100)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (Message $m) => $this->present($m));

        return response()->json(['messages' => $messages]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
        ]);

        $message = Message::create([
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);
        $message->setRelation('user', $request->user());

        $payload = $this->present($message);
        $this->broadcast($payload);

        return response()->json(['message' => $payload], 201);
    }

    /** Push the saved message to the socket server; never fail the request on it. */
    private function broadcast(array $payload): void
    {
        $url = rtrim((string) config('services.socket.url'), '/');
        if ($url === '') {
            return;
        }

        try {
            Http::timeout(3)
                ->withHeaders(['X-Socket-Secret' => (string) config('services.socket.secret')])
                ->post($url.'/broadcast', ['message' => $payload]);
        } catch (\Throwable $e) {
            Log::warning('socket broadcast failed: '.$e->getMessage());
        }
    }

    private function present(Message $message): array
    {
        return [
            'id' => (string) $message->id,
            'body' => $message->body,
            'user_id' => $message->user_id,
            'user_name' => $message->user?->name ?? 'کاربر',
            'created_at' => $message->created_at?->toIso8601String(),
        ];
    }
}
