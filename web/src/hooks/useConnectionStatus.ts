import { useState, useEffect, useCallback, useRef } from 'react';
import connectionService, { type ConnectionStatus } from '../services/connection.service';
import { toast } from '../utils/toast.util';

export const useConnectionStatus = (targetUserId: string) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'none' });
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;
    checkStatus();

    return () => {
      isUnmountedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [targetUserId]);

  const checkStatus = useCallback(async () => {
    if (!targetUserId) return;

    try {
      const response = await connectionService.checkConnectionStatus(targetUserId);
      if (!isUnmountedRef.current) {
        setConnectionStatus(response.data);
      }
    } catch (error) {
      // Silent fail - assume no connection
      if (!isUnmountedRef.current) {
        setConnectionStatus({ status: 'none' });
      }
    }
  }, [targetUserId]);

  const sendRequest = useCallback(async (message?: string) => {
    if (connectionStatus.status !== 'none' || loading) return;

    setLoading(true);
    try {
      await connectionService.sendRequest({ receiverId: targetUserId, message });
      if (!isUnmountedRef.current) {
        toast.success('Connection request sent!', { key: `send-${targetUserId}` });
        setConnectionStatus({ status: 'sent' });
      }
    } catch (error: any) {
      if (!isUnmountedRef.current) {
        const errorMsg = error.response?.data?.error || 'Failed to send request';
        toast.error(errorMsg, { key: `send-error-${targetUserId}` });
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [connectionStatus.status, loading, targetUserId]);

  const acceptRequest = useCallback(async () => {
    if (connectionStatus.status !== 'received' || !connectionStatus.requestId || loading) return;

    setLoading(true);
    try {
      await connectionService.acceptRequest(connectionStatus.requestId);
      if (!isUnmountedRef.current) {
        toast.success('Request accepted!', { key: `accept-${targetUserId}` });
        setConnectionStatus({ status: 'connected' });
      }
    } catch (error: any) {
      if (!isUnmountedRef.current) {
        const errorMsg = error.response?.data?.error || 'Failed to accept request';
        toast.error(errorMsg, { key: `accept-error-${targetUserId}` });
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [connectionStatus.status, connectionStatus.requestId, loading, targetUserId]);

  const rejectRequest = useCallback(async () => {
    if (connectionStatus.status !== 'received' || !connectionStatus.requestId || loading) return;

    setLoading(true);
    try {
      await connectionService.rejectRequest(connectionStatus.requestId);
      if (!isUnmountedRef.current) {
        toast.success('Request rejected', { key: `reject-${targetUserId}` });
        setConnectionStatus({ status: 'none' });
      }
    } catch (error: any) {
      if (!isUnmountedRef.current) {
        const errorMsg = error.response?.data?.error || 'Failed to reject request';
        toast.error(errorMsg, { key: `reject-error-${targetUserId}` });
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [connectionStatus.status, connectionStatus.requestId, loading, targetUserId]);

  const withdrawRequest = useCallback(async () => {
    if (connectionStatus.status !== 'sent' || !connectionStatus.requestId || loading) return;

    setLoading(true);
    try {
      await connectionService.withdrawRequest(connectionStatus.requestId);
      if (!isUnmountedRef.current) {
        toast.success('Request withdrawn', { key: `withdraw-${targetUserId}` });
        setConnectionStatus({ status: 'none' });
      }
    } catch (error: any) {
      if (!isUnmountedRef.current) {
        const errorMsg = error.response?.data?.error || 'Failed to withdraw request';
        toast.error(errorMsg, { key: `withdraw-error-${targetUserId}` });
      }
    } finally {
      if (!isUnmountedRef.current) {
        setLoading(false);
      }
    }
  }, [connectionStatus.status, connectionStatus.requestId, loading, targetUserId]);

  return {
    connectionStatus,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    withdrawRequest,
    refresh: checkStatus,
  };
};
