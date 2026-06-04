import LegalLayout from '@/components/LegalLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Serviço | Proforma360',
  description: 'Condições de utilização do Proforma360 e a nossa filosofia de dados locais.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Termos de Serviço" lastUpdated="3 de Junho de 2026">
      <p className="lead text-xl text-gray-500 font-medium mb-8">
        Bem-vindo ao Proforma360. Acreditamos que o software empresarial deve ser uma ferramenta ao seu serviço, e não um silo onde os seus dados ficam reféns. Estes termos refletem essa filosofia.
      </p>

      <h2>1. A Nossa Filosofia de Dados (Offline-First)</h2>
      <p>
        O Proforma360 opera num modelo <strong>Offline-First e Local-First</strong>. Isto significa que a aplicação corre diretamente no seu dispositivo (computador, tablet ou telemóvel), de forma muito semelhante a uma aplicação tradicional instalada.
      </p>
      <p>
        Ao contrário das plataformas SaaS convencionais, nós não possuímos bases de dados centrais com os seus clientes, faturas ou propostas. O software serve apenas como uma interface poderosa para que você gira os seus próprios dados. Acreditamos que a propriedade dos dados comerciais deve pertencer inteiramente a quem os produz.
      </p>

      <h2>2. Armazenamento e Propriedade (BYOS)</h2>
      <p>
        Utilizamos um modelo de <em>Bring Your Own Storage</em> (Traga o Seu Próprio Armazenamento). O Proforma360 utiliza o armazenamento local do seu navegador para garantir velocidade extrema e funcionamento sem internet. 
      </p>
      <p>
        Para garantir que nunca perde a sua informação, a aplicação sincroniza cópias de segurança encriptadas e PDFs diretamente para a sua conta pessoal do <strong>Google Drive</strong>. Você detém o controlo total sobre essa pasta e os ficheiros que lá se encontram.
      </p>

      <h2>3. A Sua Responsabilidade sobre os Dados</h2>
      <p>
        Dado que não guardamos os seus dados nos nossos servidores, a longevidade da sua informação depende das cópias de segurança. O Proforma360 fornece automatismos transparentes para sincronizar tudo com o seu Google Drive, mas <strong>encorajamos vivamente</strong> que mantenha esta funcionalidade ativa e que não apague acidentalmente a pasta de backups no seu Drive.
      </p>
      <p>
        O software está desenhado para o ajudar a recuperar facilmente a sua informação caso mude de computador, bastando fazer login e clicar em "Restaurar Backup" na secção de Configurações.
      </p>

      <h2>4. Licenciamento e Utilização Aceitável</h2>
      <p>
        Concedemos-lhe uma licença pessoal, revogável, não-exclusiva e intransferível para utilizar o Proforma360 na gestão da sua faturação e orçamentação.
      </p>
      <p>
        Embora a ferramenta seja flexível, concorda em utilizá-class de forma legal e ética, não a utilizando para emitir documentação fraudulenta, esquemas ilícitos ou qualquer outra atividade que viole as leis da sua jurisdição comercial.
      </p>

      <h2>5. Limitações do Serviço</h2>
      <p>
        O Proforma360 é fornecido "tal como está". Esforçamo-nos diariamente para oferecer uma ferramenta robusta, livre de erros e altamente otimizada. No entanto, por ser uma aplicação baseada no ecossistema web e dependente da infraestrutura do Google Drive do utilizador, não podemos garantir que o serviço será ininterrupto em circunstâncias fora do nosso controlo (ex: falhas nos serviços da Google ou limitações do browser).
      </p>

      <h2>6. Propriedade Intelectual</h2>
      <p>
        O design, o código-fonte, a marca e a arquitetura do Proforma360 são propriedade intelectual nossa. O conteúdo que você cria (as suas faturas, propostas, base de clientes) é 100% propriedade sua e não reivindicamos quaisquer direitos sobre eles.
      </p>

      <h2>7. Alterações a estes Termos</h2>
      <p>
        Poderemos atualizar estes termos ocasionalmente para refletir novas funcionalidades ou mudanças na nossa arquitetura. Sendo o Proforma360 uma plataforma focada na privacidade, qualquer alteração futura respeitará sempre o princípio fundamental: <strong>os seus dados são seus</strong>.
      </p>

      <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-100">
        <h3 className="text-lg font-bold mt-0 mb-2">Tem alguma dúvida?</h3>
        <p className="text-sm mb-0">
          A nossa equipa está sempre disponível para clarificar como a nossa arquitetura técnica protege os seus interesses. Visite a nossa página de <a href="/support" className="font-medium text-teal-600">Suporte</a> para entrar em contacto.
        </p>
      </div>
    </LegalLayout>
  );
}
