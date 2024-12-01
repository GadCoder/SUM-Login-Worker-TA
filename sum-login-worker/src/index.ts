/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response('Method Not Allowed', { status: 405 });
		}
		const body = (await request.json()) as { user: string; password: string };
		const user = body.user;
		const password = body.password;
		const url = 'https://sumvirtual.unmsm.edu.pe/sumapi/auth/login';
		const headers: Record<string, string> = {
			Accept: 'application/json',
			'Accept-Encoding': 'gzip',
			Authorization: 'AUTH TOKEN',
			Connection: 'Keep-Alive',
			'Content-Length': '52',
			'Content-Type': 'application/json',
			Host: 'sumvirtual.unmsm.edu.pe',
			'User-Agent': 'okhttp/4.9.2',
		};
		const data = { username: user, password };
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(data),
			});
			if (response.status !== 200) {
				return new Response(`Failed to login -> ${await response.text()} - ${response.status}`, { status: 400 });
			}
			const responseData: any = await response.json();
			const token = responseData['token'];
			const result: Record<string, any> = { token: `Bearer ${token}`, cookies: {} };
			const cookies = response.headers.get('set-cookie');
			if (cookies) {
				const cookieList = cookies.split(',').map((cookie) => cookie.trim().split(';')[0]);
				cookieList.forEach((cookie) => {
					const [cookieName, cookieValue] = cookie.split('=');
					result['cookies'][cookieName] = cookieValue;
				});
			}
			const saveRequest = await fetch('https://get-sum-data.gadcoder.com/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(result),
			});
			console.log('Save request status:', saveRequest.status);

			return new Response('Login successful', { status: 200 });
		} catch (error) {
			console.error('Error fetching token:', error);
			return new Response(`Failed to retrieve token:  ${error}`, { status: 400 });
		}
	},
} satisfies ExportedHandler<Env>;
