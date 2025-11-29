import { FileInput, Button , Modal } from "@mantine/core";
import { IconFile, IconX } from "@tabler/icons-react";
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { reUploadFile } from "../../api/requestDiscount/requestDiscountData";
import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";

interface InvoiceFile {
id: string;
file: File | null;
}

const AddAttachFile: React.FC<{ generalFormId: number }> = ({ generalFormId }) => {
    const [invoiceFile, setInvoiceFile] = useState<InvoiceFile[]>([
        { id: uuidv4(), file: null },
        ]);
        const [opened, { open, close }] = useDisclosure(false);

        const fileIcon =
        <IconFile size={18} stroke={1.5} />;

        const addInvoiceFile = () => {
        setInvoiceFile([...invoiceFile, { id: uuidv4(), file: null }]);
        };

        const removeInvoiceFile = (id: string) => {
        if (invoiceFile.length > 1) {
        setInvoiceFile(invoiceFile.filter((f) => f.id !== id));
        }
        };

        const updateInvoiceFile = (id: string, file: File | null) => {
        setInvoiceFile((prev) =>
        prev.map((f) => (f.id === id ? { ...f, file } : f))
        );
        };
        const navigate = useNavigate();

        const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) return;

        const formData = new FormData();
        formData.append("general_form_id", String(generalFormId));

        invoiceFile.forEach((f) => {
        if (f.file) {
        formData.append("file[]", f.file); // Laravel expects file[]
        }
        });

        try {
        const response = await reUploadFile(token, formData);
        close();
        
        setInvoiceFile([{ id: uuidv4(), file: null }]);
         window.scrollTo({ top: 0, behavior: "smooth" });

        console.log("Upload success:", response.data);
        } catch (err) {
        console.error("Upload failed:", err);
        }
        };

        return (
        <>
            <Modal opened={opened} onClose={close} title="Authentication" centered>
                <div className="flex flex-justify flex-col gap-2 ">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        {invoiceFile.map((fileField, index) => (
                        <div key={fileField.id} className="flex flex-row items-end gap-2 w-full">
                            <FileInput withAsterisk leftSection={fileIcon} label={index===0 ? "Upload Invoice or Slip" :
                                undefined} placeholder="Upload file" leftSectionPointerEvents="none" className="w-3/4"
                                value={fileField.file} onChange={(file)=> updateInvoiceFile(fileField.id, file)}
                                />
                                {index === 0 ? (
                                <Button type="button" onClick={addInvoiceFile}>
                                    Add
                                </Button>
                                ) : (
                                <Button type="button" color="red" onClick={()=> removeInvoiceFile(fileField.id)}
                                    >
                                    <IconX size={16} />
                                </Button>
                                )}
                        </div>
                        ))}

                        <div className="flex justify-end mt-4">
                            <Button type="submit">Save</Button>
                        </div>
                    </form>

                </div>
            </Modal>
            <Button className="text-gray-600 text-sm flex items-center gap-1" onClick={open}>
                <span>ℹ️</span> Upload Your File
            </Button>

        </>
        );
        };

        export default AddAttachFile;
