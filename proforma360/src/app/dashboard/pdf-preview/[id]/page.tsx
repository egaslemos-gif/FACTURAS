"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuotationsStore, useClientsStore, useCompanyStore } from "@/stores";
import { generateQuotationPDF } from "@/lib/pdf/generator";
import { ArrowLeft, Download, CloudUpload, FileText } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { uploadPdfToDrive } from "@/lib/google/drive";
import { initializeDriveWorkspace } from "@/lib/google/setup";

export default function PdfPreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  
  const { currentDetail, fetchQuotationDetail } = useQuotationsStore();
  const { company, fetchCompany } = useCompanyStore();
  const { clients, fetchClients } = useClientsStore();
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchCompany();
    fetchClients();
    if (id) {
      fetchQuotationDetail(id);
    }
  }, [id, fetchQuotationDetail, fetchCompany, fetchClients]);

  useEffect(() => {
    async function buildPdf() {
      if (currentDetail && company && clients.length > 0) {
        setIsGenerating(true);
        try {
          const client = clients.find(c => c.id === currentDetail.quotation.client_id);
          if (!client) throw new Error("Client not found");

          const bytes = await generateQuotationPDF({
            company,
            client,
            quotation: currentDetail.quotation,
            items: currentDetail.items,
          });

          setPdfBytes(bytes);
          
          // Create blob URL for iframe preview
          const blob = new Blob([bytes as any], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        } catch (error) {
          console.error("Error generating PDF", error);
        } finally {
          setIsGenerating(false);
        }
      }
    }

    buildPdf();

    // Cleanup blob url
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [currentDetail, company, clients]);

  const handleDownload = () => {
    if (pdfUrl && currentDetail) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = `${currentDetail.quotation.quotation_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleUploadToDrive = async () => {
    if (!session?.accessToken || !pdfBytes || !currentDetail) {
      alert("Sessão Google inválida ou PDF não gerado.");
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      // Ensure Drive workspace is initialized and get PDFs folder ID
      const { pdfsFolderId } = await initializeDriveWorkspace(session as any);
      
      const fileName = `${currentDetail.quotation.quotation_number}_${currentDetail.quotation.client_name}.pdf`;
      
      await uploadPdfToDrive(
        (session as any).accessToken,
        pdfsFolderId,
        pdfBytes,
        fileName
      );

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading to Drive", error);
      alert("Falha ao guardar no Google Drive.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isGenerating || !currentDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[var(--color-on-surface-variant)]">A gerar PDF de alta qualidade...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/quotations/${id}`} className="p-2 hover:bg-[var(--color-surface-container)] rounded-full transition-colors text-[var(--color-on-surface-variant)]">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-headline-lg text-[var(--color-on-surface)] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[var(--color-primary)]" />
              Documento Final
            </h1>
            <p className="text-body-md text-[var(--color-on-surface-variant)] mt-1 font-mono">
              {currentDetail.quotation.quotation_number}.pdf
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Transferir
          </button>
          
          <button
            onClick={handleUploadToDrive}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CloudUpload className="w-5 h-5" />
            )}
            {isUploading ? "A guardar..." : "Guardar no Drive"}
          </button>
        </div>
      </div>

      {uploadSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 shrink-0 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          Documento guardado com sucesso no seu Google Drive (pasta Proforma360/PDFs).
        </div>
      )}

      {/* PDF Iframe */}
      <div className="flex-1 bg-gray-200 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] overflow-hidden shadow-inner">
        {pdfUrl ? (
          <iframe 
            src={pdfUrl} 
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Falha ao carregar a pré-visualização.
          </div>
        )}
      </div>
    </div>
  );
}
