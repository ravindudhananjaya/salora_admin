import React, { useState, useEffect, useContext } from 'react';
import { Button, Space, Table, Image, Card } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchSellerExtraValue } from 'redux/slices/extraValue';
import extraService from 'services/seller/extras';
import ExtraValueModal from './extra-value-modal';
import DeleteButton from 'components/delete-button';
import { IMG_URL } from 'configs/app-global';
import { disableRefetch, setMenuData } from 'redux/slices/menu';
import FilterColumns from 'components/filter-column';
import useDidUpdate from 'helpers/useDidUpdate';
import { Context } from 'context/context';
import CustomModal from 'components/modal';

export default function ExtraValue() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { extraValues, loading, meta } = useSelector(
    (state) => state.extraValue,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);
  const data = activeMenu?.data;

  const paramsData = {
    perPage: data?.perPage || 10,
    page: data?.page || 1,
    group_id: data?.group_id || null,
  };

  const [id, setId] = useState(null);
  const [modal, setModal] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      is_show: true,
    },
    {
      title: t('title'),
      dataIndex: 'extra_group_id',
      key: 'extra_group_id',
      is_show: true,
      render: (_, row) => row?.group?.translation?.title,
    },
    {
      title: t('value'),
      dataIndex: 'value',
      key: 'value',
      is_show: true,
      render: (value, row) => (
        <Space className='extras'>
          {row?.group?.type === 'color' ? (
            <div
              className='extra-color-wrapper-contain'
              style={{ backgroundColor: row?.value }}
            />
          ) : null}
          {row?.group?.type === 'image' ? (
            <Image
              width={100}
              src={IMG_URL + row?.value}
              className='borderRadius'
            />
          ) : null}
          {row?.group?.type === 'image' ? null : <span>{row?.value}</span>}
        </Space>
      ),
    },
    {
      title: t('options'),
      is_show: true,
      render: (record) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => setModal(record)}
            disabled={!record?.group?.shop?.id}
          />
          <DeleteButton
            type='primary'
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setId([record.id]);
              setIsModalVisible(true);
              setText(true);
            }}
            disabled={!record?.group?.shop?.id}
          />
        </Space>
      ),
    },
  ]);

  const handleCancel = () => setModal(null);

  const deleteExtra = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    extraService
      .deleteValue(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        setId(null);
        dispatch(fetchSellerExtraValue(paramsData));
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoadingBtn(false);
        setId(null);
      });
  };

  useEffect(() => {
    if (activeMenu.refetch) {
      batch(() => {
        dispatch(fetchSellerExtraValue(paramsData));
        dispatch(disableRefetch(activeMenu));
      });
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    dispatch(fetchSellerExtraValue(paramsData));
  }, [activeMenu?.data]);

  function onChangePagination(pagination, filter, sorter) {
    const { pageSize: perPage, current: page } = pagination;
    const { field: column } = sorter;
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...activeMenu.data, perPage, page, column },
      }),
    );
  }

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.the.product'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  return (
    <Card
      title={t('extra.value')}
      extra={
        <Space wrap>
          <DeleteButton icon={<DeleteOutlined />} onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <Button
            type='primary'
            icon={<PlusCircleOutlined />}
            onClick={() => setModal({})}
          >
            {t('add.extra')}
          </Button>
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        loading={loading}
        columns={columns?.filter((item) => item.is_show)}
        rowSelection={rowSelection}
        dataSource={extraValues}
        rowKey={(record) => record.id}
        pagination={{
          pageSize: 10,
          page: activeMenu.data?.page || 1,
          total: meta.total,
          defaultCurrent: activeMenu.data?.page,
          current: activeMenu.data?.page,
        }}
        onChange={onChangePagination}
      />
      {modal && (
        <ExtraValueModal
          isVisible={modal}
          modal={modal}
          handleCancel={handleCancel}
          paramsData={paramsData}
        />
      )}
      <CustomModal
        click={deleteExtra}
        text={text ? t('delete') : t('all.delete')}
        loading={loadingBtn}
        setText={setId}
      />
    </Card>
  );
}
