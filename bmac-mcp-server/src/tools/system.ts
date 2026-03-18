export const systemTools = [
  {
    name: 'get_webapp_url',
    description:
      'Get the public URL of your personal product catalog webapp. ' +
      'Returns the HTTPS link where you can browse, search, and manage your private product catalog through a web interface. ' +
      'Requires NGROK_AUTHTOKEN to be configured for this MCP instance.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

interface NgrokTunnel {
  public_url: string;
  proto: string;
  config?: { addr: string };
}

interface NgrokApiResponse {
  tunnels: NgrokTunnel[];
}

export async function handleGetWebappUrl(): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    const response = await fetch('http://localhost:4040/api/tunnels', {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return {
        content: [
          {
            type: 'text',
            text: 'Webapp tunnel is not active. Ask the administrator to configure NGROK_AUTHTOKEN for your MCP instance to enable the web interface.',
          },
        ],
      };
    }

    const data = (await response.json()) as NgrokApiResponse;
    const tunnel = data.tunnels?.find((t) => t.public_url?.startsWith('https'));

    if (tunnel) {
      return {
        content: [
          {
            type: 'text',
            text: `Your personal product catalog webapp is available at:\n\n${tunnel.public_url}\n\nOpen this URL in your browser to browse products, sync suppliers, and manage your catalog through the web interface. This instance is private — it uses your own isolated database.`,
          },
        ],
      };
    }

    const httpTunnel = data.tunnels?.find((t) => t.public_url?.startsWith('http'));
    if (httpTunnel) {
      return {
        content: [
          {
            type: 'text',
            text: `Webapp is running but only an HTTP tunnel is active: ${httpTunnel.public_url}\n\nA reserved HTTPS domain (NGROK_DOMAIN) is recommended for production use.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Ngrok is running but no active tunnel found yet. The tunnel may still be establishing. Try again in a few seconds.',
        },
      ],
    };
  } catch {
    return {
      content: [
        {
          type: 'text',
          text: 'Webapp URL not available. If you want web access to your catalog, ask the administrator to configure NGROK_AUTHTOKEN for your MCP instance.',
        },
      ],
    };
  }
}
