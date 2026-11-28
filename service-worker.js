const CACHE_NAME="court-control-shell-v4";
const APP_FILES=["./","./index.html","./style.css","./main.js","./manifest.webmanifest","./gcash-qr.jpg","./icons/icon-192.png","./icons/icon-512.png","./icons/apple-touch-icon.png","./icons/icon-maskable-512.png","./icons/favicon-32.png","./icons/favicon-64.png","./app-logo.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_FILES)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  const copy=response.clone();if(new URL(event.request.url).origin===location.origin)caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;
 }).catch(()=>caches.match("./index.html"))));
});
