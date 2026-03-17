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
import {
  dateFormat,
  fullNumberFormat,
  numberFormat,
} from "../../../utils/requestDiscountUtil/helper";

type Props = {
  detailData: {
    detailData: meGeneratorDataType[];
    files: any[];
    generalForm: any;
    onRefresh: () => void;
    loading: (value: boolean) => void;
    setLoading: (value: boolean) => void;
  };
  // onDeleted: (generalFormDeleted: boolean) => void;
};

const TableDetail: React.FC<Props> = ({
  detailData,
  onRefresh,
  loading,
  setLoading,
}) => {
  const { refreshNotifications } = useContext(NotificationContext);
  const [activeGeneratorId, setActiveGeneratorId] = React.useState<
    number | null
  >(null);
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
      "Oil Level",
      "Fuel",
      "Coolant",
      "Gen Size",
      "Gen Kva",
      "Battery Volt",
      "L1",
      "L2",
      "L3",
      "Total KW",
      "Voltage L-L",
      // "Load",

      "Running Hour",
      "Cost",
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
          dateFormat(element.generator_date),
          element.generator_time_ampm,
          element.engine_oil_level,
          `${element.fuel_level}%`,
          `${element.coolant_level}%`,
          element.generator_size,
          fullNumberFormat(element.gen_kva_level),
          numberFormat(element.battery_volt_level),
          fullNumberFormat(element.l1_level),
          fullNumberFormat(element.l2_level),
          fullNumberFormat(element.l3_level),
          fullNumberFormat(element.total_kw_level),
          fullNumberFormat(element.voltageL_l_level),
          // fullNumberFormat(element.load_level ? element.load_level : ""),

          fullNumberFormat(element.running_hour),
          fullNumberFormat(element.cost ?? "-"),
          element.generator_service_date
            ? dateFormat(element.generator_service_date)
            : "- ",
          `${element.generator_cleaning_level}%`,
          element.remark ? element.remark : "-",

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
                <div className="flex gap-2">
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
                </div>
              )}
          </Group>,
        ])
      : [],
  };
  const filteredFiles = files?.filter(
    (file) => file.generator_id === activeGeneratorId,
  );

  return (
    <div className="relative mt-6 overflow-x-auto">
      {/* {loading && (
        <div className="absolute inset-0 z-50 bg-white/60 flex items-center justify-center">
          <Loader />
        </div>
      )} */}
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
