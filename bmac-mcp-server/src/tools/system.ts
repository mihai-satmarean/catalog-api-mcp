export const systemTools = [
  {
    name: 'get_webapp_url',
    description:
      'Get the public URL of your personal product catalog webapp. ' +
      'Returns the HTTPS link where you can browse, search, and manage your private product catalog through a web interface. ' +
      'The URL is automatically generated via Cloudflare tunnel — no configuration required.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

interface CloudflaredQuickTunnel {
  hostname: string;
  url?: string;
}

export async function handleGetWebappUrl(): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  // cloudflared exposes the quick tunnel URL at :20241/quicktunnel
  const metricsUrl = 'http://localhost:20241/quicktunnel';

  try {
    const response = await fetch(metricsUrl, {
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return {
        content: [
          {
            type: 'text',
            text: 'The webapp tunnel is still starting up. Try again in a few seconds.',
          },
        ],
      };
    }

    const data = (await response.json()) as CloudflaredQuickTunnel;
    const hostname = data.hostname || data.url;

    if (hostname) {
      const url = hostname.startsWith('https://') ? hostname : `https://${hostname}`;
      return {
        content: [
          {
            type: 'text',
            text: `Your personal product catalog webapp is available at:\n\n${url}\n\nOpen this URL in your browser to browse products, sync suppliers, and manage your catalog through the web interface. This instance is private — it uses your own isolated database.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Cloudflare tunnel is starting. The URL is not ready yet — try again in a few seconds.',
        },
      ],
    };
  } catch {
    return {
      content: [
        {
          type: 'text',
          text: 'Webapp tunnel is not yet active. It may still be establishing the Cloudflare connection. Try again in 10-15 seconds after the MCP server starts.',
        },
      ],
    };
  }
}
