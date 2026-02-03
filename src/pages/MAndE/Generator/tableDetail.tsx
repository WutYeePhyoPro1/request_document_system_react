import React, { useContext, useState } from "react";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";
import {
  Modal,
  Table,
  type TableData,
  Group,
  Button,
  Loader,
} from "@mantine/core";
import { IconEdit, IconFile, IconTrash } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { Link, useNavigate } from "react-router-dom";
import { generatorDelete } from "../../../api/ME/Generator/generatos";
import Swal from "sweetalert2";
import { NotificationContext } from "../../../context/NotificationContext";

type Props = {
  detailData: {
    detailData: meGeneratorDataType[];
    files: any[];
    generalForm: any;
    onRefresh: () => void;
  };
  // onDeleted: (generalFormDeleted: boolean) => void;
};

const TableDetail: React.FC<Props> = ({ detailData, onRefresh }) => {
  const { refreshNotifications } = useContext(NotificationContext);
  const [activeGeneratorId, setActiveGeneratorId] = React.useState<
    number | null
  >(null);
  const [loading, setLoading] = useState<boolean>(false);
  const {
    detailData: generatorList,
    files,
    generalForm,
    authUserId,
  } = detailData;
  console.log("as>", authUserId, generalForm);
  const [fileOpened, { open: openFileModal, close: closeFileModal }] =
    useDisclosure(false);
  const navigate = useNavigate();

  const handleDelete = async (
    generalFormID?: string | number,
    formId?: string | number,
  ) => {
    if (!generalFormID || !formId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;
    setLoading(true);

    try {
      const res = await generatorDelete(token, generalFormID, formId);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 1200,
        showConfirmButton: false,
      });
      if (generatorList.length <= 1) {
        await refreshNotifications();
        navigate(`/generator/${formId}`); // or wherever your list page is
      } else {
        onRefresh();
      }

      // onDeleted(res.general_form_deleted);
    } catch {
      Swal.fire("Error", "Delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const tableData: TableData = {
    head: [
      "No",
      "Date",
      "Time",
      "Engine Oil",
      "Fuel",
      "Coolant",
      "Battery Volt",
      "L1",
      "L2",
      "L3",
      "Total KW",
      "Voltage L-L",
      "Generator Kva",
      "Running Hour",
      "Service Date",
      "Cleaning Level",
      "Remark",
      "Image",
      generalForm?.status == "Default" &&
        authUserId == generalForm?.user_id &&
        "Action",
    ],

    body: generatorList?.length
      ? generatorList.map((element, index) => [
          index + 1,
          element.generator_date,
          element.generator_time_ampm,
          element.engine_oil_level,
          element.fuel_level,
          element.coolant_level,
          element.battery_volt_level,
          element.l1_level,
          element.l2_level,
          element.l3_level,
          element.total_kw_level,
          element.voltageL_l_level,
          element.gen_kva_level,
          element.running_hour,
          element.generator_service_date,
          element.generator_cleaning_level,
          element.remark,

          // 📎 Image

          <span
            key={`file-${element.id}`}
            className="inline-flex items-center justify-center text-blue-700"
          >
            {files?.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setActiveGeneratorId(element.id);
                  openFileModal();
                }}
                className="hover:text-blue-900 transition"
              >
                <IconFile size={18} />
              </button>
            ) : (
              <span className="text-sm text-gray-400">No file</span>
            )}
          </span>,

          // ⚙ Action
          <Group gap="xs" key={`action-${element.id}`}>
            {generalForm?.status == "Default" &&
              authUserId == generalForm?.user_id && (
                <>
                  <Link
                    to={`/generator_edit/${element.id}`}
                    state={{ generalForm }}
                    className="contents"
                  >
                    <Button size="xs" variant="light" color="blue">
                      <IconEdit size={16} />
                    </Button>
                  </Link>

                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    loading={loading}
                    onClick={() => handleDelete(generalForm?.id, element.id)}
                  >
                    <IconTrash size={16} />
                  </Button>
                </>
              )}
          </Group>,
        ])
      : [],
  };
  const filteredFiles = files?.filter(
    (file) => file.generator_id === activeGeneratorId,
  );
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader />
      </div>
    );
  }
  return (
    <div className="mt-6 overflow-x-auto">
      <Table
        data={tableData}
        styles={{
          thead: { backgroundColor: "#A9D8E9" },
          th: { backgroundColor: "inherit" },
        }}
      />

      <Modal
        opened={fileOpened}
        onClose={() => {
          closeFileModal();
          setActiveGeneratorId(null);
        }}
        title="Attached Files"
        size="lg"
        centered
      >
        {filteredFiles?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredFiles.map((file, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 border rounded-lg p-2"
              >
                {file.file_url.toLowerCase().endsWith(".pdf") ? (
                  <IconFile size={48} className="text-red-500" />
                ) : (
                  <img
                    src={file.file_url}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded"
                  />
                )}

                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline truncate w-full text-center"
                >
                  {file.name}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm">
            No files for this record
          </p>
        )}
      </Modal>
    </div>
  );
};

export default TableDetail;
