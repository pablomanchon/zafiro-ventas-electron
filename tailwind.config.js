module.exports = {
  content: [
    './src/renderer/**/*.{html,js,ts,jsx,tsx}',  // Asegúrate de incluir todos los archivos relevantes
  ],
  theme: {
    extend: {
      spacing: {
        100: '550px',
        102: '560px',
        104: '580px',
        106: '590px',
        108: '200px',
      },
      animation: {
        'pulse': 'pulse-animation 3s ease-in-out infinite alternate', // Añades la animación con duración de 3s en bucle
      },
      keyframes: {
        'pulse-animation': {
          '0%': {
            transform: 'scale(1) rotate(0deg)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          '50%': {
            transform: 'scale(1.25) rotate(45deg)',
            boxShadow: '0 8px 12px rgba(0, 0, 0, 0.3)',
          },
          '100%': {
            transform: 'scale(1) rotate(0deg)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '100%'
          },
        },
      },
    },
  },
  plugins: [],
}
