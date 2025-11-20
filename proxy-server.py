#!/usr/bin/env python3
"""
HTTP/HTTPS Proxy Server for npm/pnpm package installation
Routes package downloads through your Mac to bypass firewall restrictions
"""

import socket
import threading
import select
import sys
import ssl
import re
from urllib.parse import urlparse

class ProxyServer:
    def __init__(self, host='0.0.0.0', port=8888, buffer_size=4096):
        self.host = host
        self.port = port
        self.buffer_size = buffer_size
        self.running = False

    def start(self):
        """Start the proxy server"""
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind((self.host, self.port))
        self.sock.listen(200)
        self.running = True

        print(f"🚀 Proxy Server started on {self.host}:{self.port}")
        print(f"📡 Ready to forward npm/pnpm traffic")
        print(f"⚡ Press Ctrl+C to stop\n")

        try:
            while self.running:
                client, addr = self.sock.accept()
                print(f"✅ Connection from {addr[0]}:{addr[1]}")
                thread = threading.Thread(target=self.handle_client, args=(client,))
                thread.daemon = True
                thread.start()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down proxy server...")
            self.running = False
            self.sock.close()

    def handle_client(self, client_socket):
        """Handle individual client connections"""
        request = client_socket.recv(self.buffer_size)

        if not request:
            client_socket.close()
            return

        # Parse the request
        first_line = request.split(b'\n')[0]
        url = first_line.split(b' ')[1]

        # Handle CONNECT method for HTTPS
        if first_line.startswith(b'CONNECT'):
            self.handle_https(client_socket, url)
        else:
            self.handle_http(client_socket, request, url)

    def handle_http(self, client_socket, request, url):
        """Handle HTTP requests"""
        try:
            # Parse URL
            if url.startswith(b'http://'):
                url_str = url.decode('utf-8')
                parsed = urlparse(url_str)
                host = parsed.hostname
                port = parsed.port or 80
                path = parsed.path
                if parsed.query:
                    path += '?' + parsed.query
            else:
                # Extract host from headers
                host_line = [line for line in request.split(b'\n') if line.startswith(b'Host:')][0]
                host = host_line.split(b' ')[1].strip().decode('utf-8')
                if ':' in host:
                    host, port = host.split(':')
                    port = int(port)
                else:
                    port = 80
                path = url.decode('utf-8')

            print(f"  → HTTP: {host}:{port}{path}")

            # Create connection to target server
            proxy_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            proxy_socket.connect((host, port))

            # Rebuild request with relative path
            request_lines = request.split(b'\n')
            request_lines[0] = b' '.join([
                request_lines[0].split(b' ')[0],
                path.encode('utf-8'),
                request_lines[0].split(b' ')[2]
            ])
            modified_request = b'\n'.join(request_lines)

            proxy_socket.send(modified_request)

            # Forward data between client and server
            self.forward_data(client_socket, proxy_socket)

        except Exception as e:
            print(f"  ❌ HTTP Error: {e}")
        finally:
            client_socket.close()

    def handle_https(self, client_socket, url):
        """Handle HTTPS CONNECT requests"""
        try:
            # Parse host and port
            host_port = url.decode('utf-8')
            if ':' in host_port:
                host, port = host_port.split(':')
                port = int(port)
            else:
                host = host_port
                port = 443

            print(f"  → HTTPS: {host}:{port}")

            # Connect to target server
            proxy_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            proxy_socket.connect((host, port))

            # Send 200 Connection Established
            client_socket.send(b'HTTP/1.1 200 Connection Established\r\n\r\n')

            # Forward data between client and server
            self.forward_data(client_socket, proxy_socket)

        except Exception as e:
            print(f"  ❌ HTTPS Error: {e}")
            client_socket.send(b'HTTP/1.1 502 Bad Gateway\r\n\r\n')
        finally:
            client_socket.close()

    def forward_data(self, client_socket, proxy_socket):
        """Forward data between client and proxy server"""
        sockets = [client_socket, proxy_socket]

        while True:
            try:
                read_sockets, _, error_sockets = select.select(sockets, [], sockets, 60)

                if error_sockets:
                    break

                for sock in read_sockets:
                    data = sock.recv(self.buffer_size)

                    if not data:
                        return

                    if sock is client_socket:
                        proxy_socket.send(data)
                    else:
                        client_socket.send(data)

            except Exception:
                break

        proxy_socket.close()

if __name__ == '__main__':
    # Start proxy server
    proxy = ProxyServer(host='0.0.0.0', port=8888)

    print("=" * 50)
    print("NPM/PNPM PROXY SERVER FOR FIREWALL BYPASS")
    print("=" * 50)
    print("\nThis proxy will help install packages on your")
    print("GitLab server by routing traffic through your Mac.")
    print("\n📝 Configuration Instructions:")
    print("1. Keep this proxy running on your Mac")
    print("2. On GitLab server, configure npm to use this proxy")
    print("3. Install packages normally\n")

    proxy.start()