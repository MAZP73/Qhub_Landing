import type { Sample } from '@/components/CodeBlock';
import { API_BASE } from '@/lib/config';

const B = '__BASE__';
const raw: Sample[] = [
  { lang: 'js', code: String.raw`// qhub.js: configuración y cliente mínimo (Node 18+)
const BASE_URL = process.env.QHUB_API_URL || "${B}";
const API_KEY = process.env.QHUB_API_KEY;
if (!API_KEY) throw new Error("Falta la variable de entorno QHUB_API_KEY");

export async function qhub(method, path, { body, userId, role } = {}) {
  const headers = { Authorization: "Bearer " + API_KEY };
  if (userId) headers["X-Usuario-Id"] = userId;
  if (role) headers["X-Usuario-Rol"] = role;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60000), // la API puede tardar en despertar
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(res.status + ": " + JSON.stringify(data.detail));
  return data;
}

// Uso
const colas = await qhub("GET", "/colas", { userId: "admin-1", role: "admin" });
console.log(colas);` },
  { lang: 'python', code: String.raw`# qhub.py: configuración y cliente mínimo (pip install requests)
import os
import requests

BASE_URL = os.environ.get("QHUB_API_URL", "${B}")
API_KEY = os.environ["QHUB_API_KEY"]  # falla si no está definida

session = requests.Session()
session.headers["Authorization"] = f"Bearer {API_KEY}"


def qhub(method, path, body=None, user_id=None, role=None):
    headers = {}
    if user_id:
        headers["X-Usuario-Id"] = user_id
    if role:
        headers["X-Usuario-Rol"] = role
    res = session.request(method, BASE_URL + path, json=body, headers=headers, timeout=60)
    res.raise_for_status()  # lanza error en 4xx y 5xx
    return res.json() if res.content else None


# Uso
print(qhub("GET", "/colas", user_id="admin-1", role="admin"))` },
  { lang: 'java', code: String.raw`// Qhub.java: configuración y cliente mínimo (Java 11+)
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class Qhub {
    static final String BASE_URL = System.getenv().getOrDefault("QHUB_API_URL", "${B}");
    static final String API_KEY = System.getenv("QHUB_API_KEY");
    static final HttpClient HTTP = HttpClient.newHttpClient();

    public static String call(String method, String path, String json, String userId, String role) throws Exception {
        if (API_KEY == null) throw new IllegalStateException("Falta la variable de entorno QHUB_API_KEY");
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(BASE_URL + path))
            .timeout(Duration.ofSeconds(60))
            .header("Authorization", "Bearer " + API_KEY);
        if (userId != null) b.header("X-Usuario-Id", userId);
        if (role != null) b.header("X-Usuario-Rol", role);
        if (json != null) b.header("Content-Type", "application/json");
        b.method(method, json == null
            ? HttpRequest.BodyPublishers.noBody()
            : HttpRequest.BodyPublishers.ofString(json));

        HttpResponse<String> res = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 400) throw new RuntimeException(res.statusCode() + ": " + res.body());
        return res.body();
    }

    public static void main(String[] args) throws Exception {
        System.out.println(call("GET", "/colas", null, "admin-1", "admin"));
    }
}` },
  { lang: 'csharp', code: String.raw`// Program.cs: configuración y cliente mínimo (.NET 6+)
using System;
using System.Net.Http;
using System.Text;

var baseUrl = Environment.GetEnvironmentVariable("QHUB_API_URL") ?? "${B}";
var apiKey = Environment.GetEnvironmentVariable("QHUB_API_KEY")
    ?? throw new InvalidOperationException("Falta la variable de entorno QHUB_API_KEY");
var http = new HttpClient { Timeout = TimeSpan.FromSeconds(60) };

async Task<string> Qhub(HttpMethod method, string path, string? json = null, string? userId = null, string? role = null)
{
    var req = new HttpRequestMessage(method, baseUrl + path);
    req.Headers.Add("Authorization", "Bearer " + apiKey);
    if (userId != null) req.Headers.Add("X-Usuario-Id", userId);
    if (role != null) req.Headers.Add("X-Usuario-Rol", role);
    if (json != null) req.Content = new StringContent(json, Encoding.UTF8, "application/json");

    var res = await http.SendAsync(req);
    var text = await res.Content.ReadAsStringAsync();
    if (!res.IsSuccessStatusCode) throw new Exception((int)res.StatusCode + ": " + text);
    return text;
}

Console.WriteLine(await Qhub(HttpMethod.Get, "/colas", userId: "admin-1", role: "admin"));` },
  { lang: 'go', code: String.raw`// main.go: configuración y cliente mínimo
package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

var (
	baseURL = envOr("QHUB_API_URL", "${B}")
	apiKey  = os.Getenv("QHUB_API_KEY")
	client  = &http.Client{Timeout: 60 * time.Second}
)

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func qhub(method, path, body, userID, role string) (string, error) {
	var r io.Reader
	if body != "" {
		r = strings.NewReader(body)
	}
	req, err := http.NewRequest(method, baseURL+path, r)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	if userID != "" {
		req.Header.Set("X-Usuario-Id", userID)
	}
	if role != "" {
		req.Header.Set("X-Usuario-Rol", role)
	}
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	data, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return "", fmt.Errorf("%d: %s", res.StatusCode, data)
	}
	return string(data), nil
}

func main() {
	out, err := qhub("GET", "/colas", "", "admin-1", "admin")
	if err != nil {
		panic(err)
	}
	fmt.Println(out)
}` },
  { lang: 'php', code: String.raw`<?php
// qhub.php: configuración y cliente mínimo (extensión curl)
$BASE_URL = getenv("QHUB_API_URL") ?: "${B}";
$API_KEY = getenv("QHUB_API_KEY") ?: die("Falta la variable de entorno QHUB_API_KEY\n");

function qhub($method, $path, $body = null, $userId = null, $role = null) {
    global $BASE_URL, $API_KEY;
    $headers = ["Authorization: Bearer $API_KEY"];
    if ($userId) $headers[] = "X-Usuario-Id: $userId";
    if ($role) $headers[] = "X-Usuario-Rol: $role";

    $opts = [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60];
    if ($body !== null) {
        $headers[] = "Content-Type: application/json";
        $opts[CURLOPT_POSTFIELDS] = json_encode($body);
    }
    $opts[CURLOPT_HTTPHEADER] = $headers;

    $ch = curl_init($BASE_URL . $path);
    curl_setopt_array($ch, $opts);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($code >= 400) throw new Exception("$code: $res");
    return $res === "" ? null : json_decode($res, true);
}

print_r(qhub("GET", "/colas", null, "admin-1", "admin"));` },
  { lang: 'ruby', code: String.raw`# qhub.rb: configuración y cliente mínimo
require "net/http"
require "json"

BASE_URL = ENV.fetch("QHUB_API_URL", "${B}")
API_KEY = ENV.fetch("QHUB_API_KEY") # falla si no está definida

def qhub(method, path, body: nil, user_id: nil, role: nil)
  uri = URI(BASE_URL + path)
  req = Net::HTTP.const_get(method.capitalize).new(uri)
  req["Authorization"] = "Bearer #{API_KEY}"
  req["X-Usuario-Id"] = user_id if user_id
  req["X-Usuario-Rol"] = role if role
  if body
    req["Content-Type"] = "application/json"
    req.body = body.to_json
  end

  res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https", read_timeout: 60) { |http| http.request(req) }
  raise "#{res.code}: #{res.body}" if res.code.to_i >= 400
  res.body.to_s.empty? ? nil : JSON.parse(res.body)
end

puts qhub("GET", "/colas", user_id: "admin-1", role: "admin")` },
];

/** Cliente reutilizable por lenguaje, con la URL base ya puesta. */
export const CLIENTS: Sample[] = raw.map((s) => ({ ...s, code: s.code.split(B).join(API_BASE) }));
