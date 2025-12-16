import { FileInput, Button, Modal } from "@mantine/core";
import { IconFile, IconX } from "@tabler/icons-react";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { reUploadFile } from "../../api/requestDiscount/requestDiscountData";
import { useDisclosure } from "@mantine/hooks";

interface InvoiceFile {
  id: string;
  file: File | null;
}

const AddAttachFile: React.FC<{
  generalFormId: number;
  onUploaded: () => void;
}> = ({ generalFormId, onUploaded }) => {
  const [invoiceFile, setInvoiceFile] = useState<InvoiceFile[]>([
    { id: uuidv4(), file: null },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  const fileIcon = <IconFile size={18} stroke={1.5} />;

  const updateInvoiceFile = (id: string, file: File | null) => {
    setInvoiceFile((prev) =>
      prev.map((f) => (f.id === id ? { ...f, file } : f))
    );
  };
console.log("invoiceFile>>" , invoiceFile) ;
  const addInvoiceFile = () => {
    setInvoiceFile([...invoiceFile, { id: uuidv4(), file: null }]);
  };

  const removeInvoiceFile = (id: string) => {
    if (invoiceFile.length > 1) {
      setInvoiceFile(invoiceFile.filter((f) => f.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // const formData = new FormData();
    // formData.append("general_form_id", String(generalFormId));

    // invoiceFile.forEach((f) => {
    //   if (f.file) {
    //     formData.append("file[]", f.file);
    //   }
    // });
    const formData = new FormData();
  formData.append("general_form_id", String(generalFormId));

  invoiceFile.forEach((item, index) => {
    if (item.file) {
      formData.append(`file[]`, item.file); // Laravel expects array
      formData.append(`file_uuid[]`, item.id); // OPTIONAL (if you want UUID)
    }
  });
    try {
      setSubmitting(true);
      await reUploadFile(token, formData);

      close();
      setInvoiceFile([{ id: uuidv4(), file: null }]);

      onUploaded(); // 🔥 reload Detail
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal opened={opened} onClose={close} title="Attach File" centered>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {invoiceFile.map((fileField, index) => (
            <div key={fileField.id} className="flex gap-2">
              {/* <FileInput
                leftSection={fileIcon}
                placeholder="Upload file"
                value={fileField.file}
                onChange={(file) => updateInvoiceFile(fileField.id, file)}
                disabled={submitting}
                className="flex-1"
                accept="image/*,application/pdf"
              /> */}
              <FileInput
  leftSection={fileIcon}
  placeholder="Upload file"
  value={fileField.file}
  onChange={(file) => updateInvoiceFile(fileField.id, file)}
  disabled={submitting}
  accept="image/*,application/pdf" // allow images + PDFs
  className="flex-1"
/>


              {index === 0 ? (
                <Button type="button" onClick={addInvoiceFile}>
                  Add
                </Button>
              ) : (
                <Button
                  type="button"
                  color="red"
                  onClick={() => removeInvoiceFile(fileField.id)}
                >
                  <IconX size={16} />
                </Button>
              )}
            </div>
          ))}

          <Button type="submit" loading={submitting}>
            Save
          </Button>
        </form>
      </Modal>

      <Button onClick={open}>📎 Upload Your File</Button>
    </>
  );
};

export default AddAttachFile;
