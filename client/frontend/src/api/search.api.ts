import api from './axiosInstance';

const url = 'search/v1';

export const SearchAPI = {
  search: (params: { query: string; type?: string; page?: number; limit?: number }) =>
    api.get(`/${url}`, { params }),

  searchUsers: (query: string) =>
    api.get(`/${url}/users`, { params: { query } }),

  searchDocuments: (query: string) =>
    api.get(`/${url}/documents`, { params: { query } }),

  searchTickets: (query: string) =>
    api.get(`/${url}/tickets`, { params: { query } }),

  searchChats: (query: string) =>
    api.get(`/${url}/chats`, { params: { query } }),

  globalSearch: (query: string) =>
    api.get(`/${url}/global`, { params: { query } }),
};
