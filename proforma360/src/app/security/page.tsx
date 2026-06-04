import LegalLayout from '@/components/LegalLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Segurança | Proforma360',
  description: 'Como a nossa arquitetura reduz riscos e protege a sua empresa contra fugas de dados.',
};

export default function SecurityPage() {
  return (
    <LegalLayout title="Segurança & Arquitetura" lastUpdated="3 de Junho de 2026">
      <p className="lead text-xl text-gray-500 font-medium mb-8">
        No Proforma360, a segurança não é um módulo adicional que tentamos implementar por cima de bases de dados vulneráveis. A segurança faz parte da própria fundação técnica de como a aplicação foi construída.
      </p>

      <h2>A Vantagem da Descentralização</h2>
      <p>
        As maiores fugas de dados do mundo corporativo ocorrem por um único motivo: a centralização. Quando um provedor de software armazena os dados de milhares de empresas numa única base de dados massiva, essa base de dados torna-se um alvo extremamente lucrativo para atacantes.
      </p>
      <p>
        O Proforma360 mitiga este risco pela raiz: <strong>nós não temos um repositório centralizado de documentos.</strong> Os seus dados ficam consigo. Não existe um "pote de ouro" para os atacantes roubarem nos nossos servidores, o que reduz substancialmente o risco de fugas de informação em massa.
      </p>

      <h2>Infraestrutura de Classe Mundial (Google Drive)</h2>
      <p>
        Para armazenamento, apoiamo-nos na infraestrutura do Google Drive. Isto significa que os seus ficheiros estão protegidos pela mesma arquitetura criptográfica que protege governos e corporações da Fortune 500.
      </p>
      <p>
        A ligação entre o Proforma360 e o seu Drive é feita através de protocolos seguros (HTTPS/TLS) e a própria Google aplica encriptação em repouso (<em>encryption at rest</em>) a todos os seus dados.
      </p>

      <h2>Isolamento de Links de Partilha (Share Links)</h2>
      <p>
        Quando decide gerar um link público para partilhar uma proposta com o seu cliente (ex: <code>proforma360.vercel.app/view/id-da-proposta</code>), o processo é desenhado com a segurança em mente:
      </p>
      <ul>
        <li>O documento partilhado é isolado, convertido para um ficheiro estático sem ligação direta à sua base de dados principal.</li>
        <li>O ficheiro é alojado anonimamente e de forma encriptada na sua infraestrutura, sendo apenas descodificável por quem tem o link exato.</li>
        <li>Links de propostas comerciais não são indexados por motores de busca como o Google, mantendo-se perfeitamente ocultos de rastreadores da web.</li>
      </ul>

      <h2>Prevenção contra Perda de Dados (Backups)</h2>
      <p>
        A aplicação gera continuamente versões atualizadas da sua base de dados (backups) enquanto você trabalha. Estes instantâneos (<em>snapshots</em>) previnem cenários como apagamentos acidentais no seu browser ou problemas com o seu computador portátil. Em qualquer emergência, os seus dados continuam sãos e salvos no seu ecossistema privado.
      </p>

      <h2>Auditorias e Monitorização Web</h2>
      <p>
        A nossa página e interface utilizam o que existe de mais moderno no ecossistema <em>front-end</em> (React e Next.js), hospedados globalmente numa rede de distribuição extrema (Edge Network). Isto garante imunidade prática contra ataques comuns da web, assegurando que, mesmo sob pressão externa massiva na internet, a sua aplicação no browser continue a gerar orçamentos sem falhas.
      </p>
    </LegalLayout>
  );
}
