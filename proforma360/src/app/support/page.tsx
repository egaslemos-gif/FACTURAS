import LegalLayout from '@/components/LegalLayout';
import { Metadata } from 'next';
import { DatabaseBackup, WifiOff, Share2, FileDown, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Suporte ao Cliente | Proforma360',
  description: 'Guias rápidos e ajuda para otimizar o uso do Proforma360.',
};

export default function SupportPage() {
  return (
    <LegalLayout title="Central de Ajuda" lastUpdated="3 de Junho de 2026">
      <p className="lead text-xl text-gray-500 font-medium mb-12">
        A nossa arquitetura moderna torna a plataforma extremamente rápida, mas funciona de forma um pouco diferente dos sistemas clássicos. Abaixo respondemos às principais dúvidas.
      </p>

      <h2 className="mb-6">Guias Rápidos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16 not-prose">
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <DatabaseBackup className="w-6 h-6 text-teal-600 mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">Como recuperar cópias de segurança?</h3>
          <p className="text-sm text-gray-600">
            Aceda às <strong>Configurações</strong> e clique na aba <em>Base de Dados</em>. Carregue em "Restaurar Backup do Drive". A aplicação vai buscar a versão mais recente gravada de forma automática na sua conta Google.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <WifiOff className="w-6 h-6 text-teal-600 mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">Posso usar a app sem internet?</h3>
          <p className="text-sm text-gray-600">
            Sim! O Proforma360 é uma aplicação Offline-First. Pode continuar a criar clientes, emitir e visualizar propostas mesmo sem Wi-Fi. A sincronização com a nuvem ocorrerá automaticamente quando a internet voltar.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <Share2 className="w-6 h-6 text-teal-600 mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">Como partilhar uma proposta?</h3>
          <p className="text-sm text-gray-600">
            Dentro de uma proforma, clique no botão <strong>Partilhar</strong>. Pode escolher copiar um modelo elegante para o seu e-mail (Premium HTML), enviar diretamente por WhatsApp ou simplesmente partilhar o Link Público Seguro.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <FileDown className="w-6 h-6 text-teal-600 mb-3" />
          <h3 className="font-bold text-gray-900 mb-2">Como alterar o logotipo dos PDFs?</h3>
          <p className="text-sm text-gray-600">
            Navegue até à aba <strong>A Minha Empresa</strong>. Aí poderá fazer o upload de um novo logótipo e ajustar informações vitais, assim como editar os textos rodapé padronizados.
          </p>
        </div>

      </div>

      <h2>Perguntas Frequentes (FAQ)</h2>
      
      <h4>Se apagar a minha conta Google, perco tudo?</h4>
      <p>
        O Proforma360 guarda as informações localmente no seu computador e utiliza a sua conta Google Drive estritamente como cofre de segurança (backup). Se eliminar a sua conta Google, perde apenas o mecanismo de cópias de segurança automáticas. Aconselhamos <strong>veementemente</strong> que não partilhe ou apague ficheiros manualmente da pasta "Proforma360" do seu Drive.
      </p>

      <h4>Mudei de computador. Como acedo à minha conta?</h4>
      <p>
        No novo computador, aceda a <code>proforma360.vercel.app</code>, faça Login com a mesma conta do Google e, quando o ecrã carregar, vá imediatamente a <strong>Configurações &gt; Base de Dados</strong> e clique em <em>Restaurar Backup do Drive</em>. Num par de segundos, todo o seu histórico será importado para a nova máquina!
      </p>

      <h4>Por que não vejo as mesmas faturas no telemóvel e no PC?</h4>
      <p>
        Sendo um sistema <em>Local-First</em>, a sincronização não acontece segundo-a-segundo como no Facebook, mas sim via o cofre do Google Drive. Para ter os dados iguais em ambos os dispositivos, certifique-se que fez um <em>Backup</em> no PC, e de seguida realize um <em>Restauro</em> (Restore) na mesma conta no telemóvel. O nosso formato de partilha por PDF mitiga quase na totalidade a necessidade de gestão síncrona em múltiplos ecrãs em simultâneo.
      </p>

      <hr className="my-12 border-gray-100" />

      <div className="bg-teal-50 border border-teal-100 rounded-xl p-8 text-center not-prose">
        <Mail className="w-8 h-8 text-teal-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ainda precisa de ajuda técnica?</h3>
        <p className="text-gray-600 mb-6">
          Envie-nos um e-mail com a sua dúvida e capturas de ecrã (se aplicável). A nossa equipa de desenvolvimento irá responder-lhe com a maior brevidade possível.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="mailto:egaslemos@gmail.com?cc=cycode360@gmail.com&subject=Suporte%20T%C3%A9cnico%20Proforma360" className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" /> App de Email
          </a>
          <a href="https://mail.google.com/mail/?view=cm&fs=1&to=egaslemos@gmail.com&cc=cycode360@gmail.com&su=Suporte%20T%C3%A9cnico%20Proforma360" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            Gmail Web
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Se os botões não abrirem, envie e-mail diretamente para <strong>egaslemos@gmail.com</strong> (CC: cycode360@gmail.com)
        </p>
      </div>

    </LegalLayout>
  );
}
