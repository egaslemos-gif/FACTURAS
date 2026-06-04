import LegalLayout from '@/components/LegalLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Proforma360',
  description: 'Descubra como a nossa arquitetura protege a privacidade da sua empresa.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidade" lastUpdated="3 de Junho de 2026">
      <p className="lead text-xl text-gray-500 font-medium mb-8">
        No mundo do software moderno, a sua informação comercial é frequentemente o produto. No Proforma360, abordamos a privacidade através de uma solução radical: <strong>não armazenamos os seus dados.</strong>
      </p>

      <h2>Privacidade pela Arquitetura</h2>
      <p>
        O Proforma360 foi desenhado desde o primeiro dia com um princípio inabalável: a sua base de clientes, faturas, métricas financeiras e documentos comerciais são estritamente confidenciais. 
      </p>
      <p>
        Para garantir isto com absoluta certeza técnica, adotamos uma arquitetura onde <strong>o Proforma360 não possui bases de dados centralizadas para a informação dos utilizadores</strong>. Não armazenamos os seus documentos comerciais em servidores da nossa empresa. Se não os possuímos, não os podemos ler, partilhar, analisar ou perder num ataque cibernético.
      </p>

      <h2>Onde residem os seus dados?</h2>
      <p>
        A sua informação permanece sempre sob a sua posse física e digital:
      </p>
      <ul>
        <li><strong>No seu dispositivo:</strong> Toda a rapidez e inteligência da aplicação acontecem localmente, no seu próprio computador ou telemóvel.</li>
        <li><strong>Na sua conta Google:</strong> Para que nunca perca o seu trabalho e possa aceder noutros dispositivos, a aplicação guarda cópias de segurança encriptadas e PDFs de forma privada e invisível no seu próprio Google Drive.</li>
      </ul>

      <h2>O papel do Google Drive e do Login</h2>
      <p>
        Utilizamos o login do Google (OAuth) com um único propósito: permitir que a aplicação aceda a uma pasta reservada no seu Google Drive para alojar os seus próprios ficheiros. 
      </p>
      <p>
        Não acedemos à sua caixa de email, não lemos os seus outros ficheiros do Drive e não recolhemos o seu perfil social. A autenticação serve puramente como um canal técnico para lhe devolver o controlo sobre o alojamento da sua plataforma.
      </p>

      <h2>A Informação que a Infraestrutura Processa</h2>
      <p>
        Sendo o Proforma360 uma aplicação web avançada (hospedada na Vercel), a infraestrutura processa estritamente o necessário para que o software carregue no seu ecrã:
      </p>
      <ul>
        <li>Registos técnicos anónimos (logs de servidor) para garantir que a aplicação não está em baixo ou a sofrer ataques de negação de serviço.</li>
        <li>Metadados essenciais de sessão técnica (cookies funcionais) para que não tenha de fazer login sempre que abre a página.</li>
      </ul>
      <p>
        Nenhum destes registos contém dados das suas propostas comerciais ou detalhes dos seus clientes.
      </p>

      <h2>Ferramentas de Terceiros e Análises</h2>
      <p>
        Não embutimos rastreadores de publicidade (tracking pixels), ferramentas de retargeting ou análises comportamentais invasivas dentro da aplicação. O nosso foco é fornecer uma ferramenta de faturação limpa, rápida e que o ajude a fechar negócios, sem transformar a sua atividade num perfil de marketing.
      </p>

      <h2>Os Seus Direitos e Controlo</h2>
      <p>
        Como os dados comerciais não nos pertencem, não existe um processo complexo para "pedir a remoção dos seus dados" dos nossos sistemas. O controlo está literalmente nas suas mãos:
      </p>
      <p>
        Se decidir deixar de usar o Proforma360, basta apagar a pasta "Proforma360" do seu Google Drive. E está feito. Todo o histórico da sua empresa desaparece permanentemente sem que precisemos de intervir.
      </p>
    </LegalLayout>
  );
}
