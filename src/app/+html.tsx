import { ScrollViewStyleReset } from 'expo-router/html';
import { PropsWithChildren } from 'react';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Ghostcar',
  url: 'https://ghostcar.com.br/',
  logo: 'https://ghostcar.com.br/assets/images/ghostcar-app-icon.png',
  description: 'Plataforma brasileira de aluguel de carros entre pessoas.',
  sameAs: ['https://github.com/ghostcarbr-dev/Ghostcar'],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Ghostcar',
  url: 'https://ghostcar.com.br/',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://ghostcar.com.br/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta
          name="description"
          content="Ghostcar conecta pessoas que querem alugar carros com proprietários próximos. Pesquise veículos por localização, compare preços e publique seu carro com facilidade."
        />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://ghostcar.com.br/" />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Ghostcar" />
        <meta property="og:title" content="Ghostcar | Aluguel de carros entre pessoas" />
        <meta
          property="og:description"
          content="Encontre carros publicados perto de você ou publique seu veículo na Ghostcar."
        />
        <meta property="og:url" content="https://ghostcar.com.br/" />
        <meta property="og:image" content="https://ghostcar.com.br/assets/images/ghostcar-app-icon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ghostcar | Aluguel de carros entre pessoas" />
        <meta
          name="twitter:description"
          content="Pesquise, compare e alugue carros próximos. Publique seu veículo e conecte-se com clientes."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
