import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// ChatGPT specific colors
				chatgpt: {
					'user-bg': '#FFFFFF',
					'user-bg-dark': '#343541',
					'ai-bg': '#F7F7F8',
					'ai-bg-dark': '#444654',
					'sidebar': '#F7F7F8',
					'sidebar-dark': '#202123',
					'btn-primary': '#10A37F',
					'btn-primary-hover': '#0E906F'
				}
			},
			typography: {
				DEFAULT: {
				  css: {
					maxWidth: '100%',
					color: 'var(--tw-prose-body)',
					'[class~="lead"]': {
					  color: 'var(--tw-prose-lead)',
					},
					a: {
					  color: 'var(--tw-prose-links)',
					  textDecoration: 'underline',
					  fontWeight: '500',
					},
					strong: {
					  color: 'var(--tw-prose-bold)',
					  fontWeight: '600',
					},
					code: {
					  color: 'var(--tw-prose-code)',
					  fontWeight: '400',
					  backgroundColor: 'var(--tw-prose-code-bg)',
					  borderRadius: '0.25rem',
					  paddingLeft: '0.25rem',
					  paddingRight: '0.25rem',
					  paddingTop: '0.125rem',
					  paddingBottom: '0.125rem',
					},
					pre: {
					  color: 'var(--tw-prose-pre-code)',
					  backgroundColor: 'var(--tw-prose-pre-bg)',
					  borderRadius: '0.375rem',
					  padding: '0.75rem 1rem',
					},
					'pre code': {
					  backgroundColor: 'transparent',
					  padding: '0',
					},
				  },
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['var(--font-sans)', 'Inter', 'Söhne', 'system-ui', 'sans-serif'],
			},
			boxShadow: {
				DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
				lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
				xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(10px)' },
				},
				'bounce': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-4px)' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.2s ease-out forwards',
				'fade-out': 'fade-out 0.2s ease-out forwards',
				'bounce': 'bounce 1s infinite',
				'bounce-delay-1': 'bounce 1s infinite 0.1s',
				'bounce-delay-2': 'bounce 1s infinite 0.2s',
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require('@tailwindcss/typography'),
	],
} satisfies Config;
