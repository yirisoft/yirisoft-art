<?php
// Saves content.json from the dashboard (admin.html).
//
// SETUP (one time): change the password below before uploading to Hostinger.
// Use a long, unique password — this is the only thing protecting your
// site content from being edited by strangers.
$PASSWORD = 'CHANGE-ME-before-uploading';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST only']);
    exit;
}

// ---- Media upload (multipart form from the dashboard's drop zone) ----
if (!empty($_FILES)) {
    if (!hash_equals($PASSWORD, (string)($_POST['password'] ?? '')) || $PASSWORD === 'CHANGE-ME-before-uploading') {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => $PASSWORD === 'CHANGE-ME-before-uploading' ? 'Set a real password in save.php first' : 'Wrong password']);
        exit;
    }
    if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Upload failed — file missing or too large for the server limit']);
        exit;
    }
    $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'mp4'], true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Only jpg, png, or mp4 files are allowed']);
        exit;
    }
    $safe = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($_FILES['file']['name']));
    $dir  = __DIR__ . '/assets/uploads';
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not create assets/uploads folder']);
        exit;
    }
    if (!move_uploaded_file($_FILES['file']['tmp_name'], $dir . '/' . $safe)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Could not save the file (check folder permissions)']);
        exit;
    }
    echo json_encode(['ok' => true, 'path' => 'assets/uploads/' . $safe]);
    exit;
}

// ---- Content save (JSON body from the Publish button) ----
$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!is_array($body) || !hash_equals($PASSWORD, (string)($body['password'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Wrong password']);
    exit;
}

if ($PASSWORD === 'CHANGE-ME-before-uploading') {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Set a real password in save.php first']);
    exit;
}

$content = $body['content'] ?? null;
if (!is_array($content)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing or invalid content']);
    exit;
}

// Keep one backup of the previous version, just in case.
$target = __DIR__ . '/content.json';
if (file_exists($target)) {
    copy($target, __DIR__ . '/content.backup.json');
}

$json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if (file_put_contents($target, $json) === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not write content.json (check file permissions)']);
    exit;
}

echo json_encode(['ok' => true]);
