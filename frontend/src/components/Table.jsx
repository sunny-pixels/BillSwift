import React, { useRef, useState, useEffect } from "react";
import { HiPencilAlt } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import EditItemsModal from "./EditItemsModal";
import axios from "axios";

const Table = ({
  items,
  setItems,
  highlightedItemId,
  className,
  headerClassName,
  rowClassName,
  highlightClassName,
  iconClassName,
  cellClassName,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const highlightedRowRef = useRef(null);

  useEffect(() => {
    if (highlightedItemId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedItemId]);

  const handleDeleteClick = (itemId) => {
    axios
      .delete(`http://localhost:5001/deleteItem/${itemId}`)
      .then(() => {
        setItems(items.filter((item) => item._id !== itemId));
      })
      .catch((err) => console.log(err));
  };

  const handleEditClick = (itemId) => {
    setSelectedItemId(itemId);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedItemId(null);
  };

  const handleItemUpdated = (updatedItem) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item._id === updatedItem._id ? updatedItem : item
      )
    );
  };

  return (
    <>
      <div className="h-[292px] overflow-y-auto custom-scroll">
        <table className={`sticky-header ${className}`}>
          <thead>
            <tr>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                No
              </th>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                Item Code
              </th>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                Product
              </th>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                Quantity
              </th>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                MRP
              </th>
              <th className={`${cellClassName} ${headerClassName} text-center`}>
                Net Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((i, index) => {
                const isHighlighted =
                  i.itemCode === highlightedItemId ||
                  i._id === highlightedItemId;

                return (
                  <tr
                    key={i.itemCode || i._id}
                    ref={isHighlighted ? highlightedRowRef : null}
                    className={`group ${rowClassName} ${
                      isHighlighted ? highlightClassName : ""
                    }`}
                  >
                    <td
                      className={`${cellClassName} text-center relative cursor-pointer`}
                      onClick={() => handleEditClick(i._id)}
                    >
                      <div className="flex items-center justify-center">
                        <span>{index + 1}</span>
                        <HiPencilAlt
                          className={`${iconClassName} absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity`}
                        />
                      </div>
                    </td>
                    <td className={`${cellClassName} text-center`}>
                      {"MANUAL-" + Math.floor(100000 + Math.random() * 900000)}
                    </td>
                    <td className={`${cellClassName} text-center`}>
                      {i.product.charAt(0).toUpperCase() + i.product.slice(1)}
                    </td>
                    <td className={`${cellClassName} text-center`}>
                      {i.quantity}
                    </td>
                    <td className={`${cellClassName} text-center`}>{i.mrp}</td>
                    <td className={`${cellClassName} text-center relative`}>
                      <div className="flex items-center justify-center">
                        <span>{i.netamt}</span>
                        <MdDelete
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(i._id);
                          }}
                          className={`${iconClassName} absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className={`${cellClassName} text-center text-[#767c8f]`}
                >
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditItemsModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        itemId={selectedItemId}
        onItemUpdated={handleItemUpdated}
      />

      <style>
        {`
      .custom-scroll {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE 10+ */
      }
      .custom-scroll::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
      .sticky-header th {
        position: sticky;
        top: 0;
        z-index: 2;
      }
    `}
      </style>
    </>
  );
};

export default Table;
