import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import api from '../services/api';
import type { Lead, LeadStatus, LeadSource, PaginationMetadata } from '../types/index';
import {
  Sun,
  Moon,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Trash,
  X,
  Clock
} from 'lucide-react';


const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || 
           localStorage.getItem('theme') === 'dark';
  });

  // Leads and Query States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [page, setPage] = useState<number>(1);

  // Debounced search term
  const debouncedSearch = useDebounce(search, 500);

  // Modals state
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [crudMode, setCrudMode] = useState<'create' | 'edit'>('create');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    email: '',
    status: 'New' as LeadStatus,
    source: 'Website' as LeadSource
  });
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Delete Confirm Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // View Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch leads on state change
  useEffect(() => {
    fetchLeads();
  }, [debouncedSearch, statusFilter, sourceFilter, sortBy, page]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {
        page,
        limit: 10,
        sortBy
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;

      const response = await api.get('/leads', { params });
      if (response.data.success) {
        setLeads(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve leads.');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change to avoid empty views
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sourceFilter, sortBy]);

  // CSV Export trigger
  const handleExportCSV = async () => {
    try {
      const params: any = { sortBy };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;

      const response = await api.get('/leads/export/csv', {
        params,
        responseType: 'blob' // Important for file download
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leads_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('Failed to export CSV: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Create/Edit modal open
  const openCrudModal = (mode: 'create' | 'edit', lead?: Lead) => {
    setCrudMode(mode);
    setModalError('');
    if (mode === 'edit' && lead) {
      setSelectedLead(lead);
      setModalForm({
        name: lead.name,
        email: lead.email,
        status: lead.status,
        source: lead.source
      });
    } else {
      setSelectedLead(null);
      setModalForm({
        name: '',
        email: '',
        status: 'New',
        source: 'Website'
      });
    }
    setIsCrudModalOpen(true);
  };

  // Submit Create/Edit
  const handleCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!modalForm.name.trim() || !modalForm.email.trim()) {
      setModalError('Name and email are required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(modalForm.email)) {
      setModalError('Please enter a valid email format.');
      return;
    }

    try {
      setModalSubmitting(true);
      if (crudMode === 'create') {
        const response = await api.post('/leads', modalForm);
        if (response.data.success) {
          setIsCrudModalOpen(false);
          fetchLeads();
        }
      } else if (crudMode === 'edit' && selectedLead) {
        const response = await api.put(`/leads/${selectedLead._id}`, modalForm);
        if (response.data.success) {
          setIsCrudModalOpen(false);
          fetchLeads();
        }
      }
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Error occurred while saving lead data.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete handler
  const openDeleteModal = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    try {
      setDeleteSubmitting(true);
      const response = await api.delete(`/leads/${leadToDelete._id}`);
      if (response.data.success) {
        setIsDeleteModalOpen(false);
        setLeadToDelete(null);
        fetchLeads();
      }
    } catch (err: any) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Details Modal handler
  const openDetailsModal = (lead: Lead) => {
    setDetailsLead(lead);
    setIsDetailsModalOpen(true);
  };

  // Helper styles for Badges
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/40';
      case 'Qualified':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40';
      case 'Lost':
        return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getSourceBadge = (source: LeadSource) => {
    switch (source) {
      case 'Website':
        return 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40';
      case 'Instagram':
        return 'bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-955/25 dark:text-pink-400 dark:border-pink-900/40';
      case 'Referral':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40';
      default:
        return 'bg-gray-50 text-gray-750 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-200 dark:border-slate-850 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-indigo-650 rounded-xl flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-650 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent leading-none">
                Smart Leads
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mt-1">
                Lead Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Profile Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-850 rounded-full border border-slate-200 dark:border-slate-800">
              <User className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{user?.name}</span>
              <span className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-bold">
                {user?.role}
              </span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-455" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-rose-600 dark:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-955/15 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-205 dark:hover:border-rose-955/20 transition-all cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT BODY */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* WELCOME BANNER & STATS CARDS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Keep track of sales inquiries, statuses, and performance conversion pipelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm flex items-center gap-2 hover:shadow transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => openCrudModal('create')}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-750 dark:bg-violet-500 dark:hover:bg-violet-600 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md shadow-violet-500/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>
        </div>

        {/* QUICK STATUS METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Leads */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Active Leads</span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {pagination ? pagination.totalRecords : '...'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Updated in real-time</p>
            </div>
          </div>

          {/* New Leads */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">New Enquiries</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-650 dark:text-blue-400 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {leads.filter(l => l.status === 'New').length}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Pending first contact</p>
            </div>
          </div>

          {/* Qualified Leads */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qualified Leads</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {leads.filter(l => l.status === 'Qualified').length}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Ready for sales conversion</p>
            </div>
          </div>

          {/* User Status Role */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Access Profile</span>
              <div className="p-2 bg-violet-50 dark:bg-violet-950/40 text-violet-650 dark:text-violet-400 rounded-lg">
                <User className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-lg font-bold text-slate-905 dark:text-white truncate block">
                {user?.role}
              </span>
              <p className="text-[10px] text-slate-450 mt-1 block truncate">Logged in as {user?.email}</p>
            </div>
          </div>
        </div>

        {/* CONTROLS (SEARCH & FILTERS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-2xl p-5 hover:shadow-md transition-all space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search Bar */}
            <div className="md:col-span-2 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads by name or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
              />
            </div>

            {/* Filter by Status */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            {/* Filter by Source */}
            <div>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
              >
                <option value="">All Sources</option>
                <option value="Website">Website</option>
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-850">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Filters: {statusFilter || 'None'} / {sourceFilter || 'None'} / {search ? `"${search}"` : 'None'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
              >
                <option value="latest">Latest Created</option>
                <option value="oldest">Oldest Created</option>
              </select>
            </div>
          </div>
        </div>

        {/* LEADS LIST TABLE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden hover:shadow-md transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-850">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lead Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Added</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-105 dark:divide-slate-850">
                {loading ? (
                  // Skeleton loader
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-rose-500">
                      <AlertCircle className="w-10 h-10 mx-auto mb-3 text-rose-500" />
                      <p className="font-semibold">{error}</p>
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
                      <h3 className="text-lg font-bold text-slate-705 dark:text-slate-300">No leads found</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">
                        Try modifying your filters, search terms, or add a new lead record.
                      </p>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all cursor-pointer"
                      onClick={() => openDetailsModal(lead)}
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900 dark:text-white block hover:underline">
                          {lead.name}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {lead.email}
                      </td>

                      {/* Source */}
                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className={`px-2.5 py-1 rounded-full ${getSourceBadge(lead.source)}`}>
                          {lead.source}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className={`px-2.5 py-1 rounded-full ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openCrudModal('edit', lead)}
                            className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Edit lead"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          {/* Role-Based Access: delete is enabled only for Admin */}
                          {user?.role === 'Admin' ? (
                            <button
                              onClick={() => openDeleteModal(lead)}
                              className="p-1.5 text-slate-550 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/15 rounded-lg transition-all cursor-pointer"
                              title="Delete lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50"
                              title="Deletes restricted to Admin only"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION METRIC CONTROLS */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-850 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/10">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Showing Page <strong className="text-slate-900 dark:text-white">{pagination.currentPage}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{pagination.totalPages}</strong> (
                {pagination.totalRecords} total records)
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="p-2 border border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 border border-slate-250 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CRUD MODAL CONTAINER */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {crudMode === 'create' ? 'Add New Lead' : 'Edit Lead Details'}
              </h3>
              <button
                onClick={() => setIsCrudModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrudSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium">
                  {modalError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Lead Name
                </label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={modalForm.email}
                  onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Source
                  </label>
                  <select
                    value={modalForm.source}
                    onChange={(e) => setModalForm({ ...modalForm, source: e.target.value as LeadSource })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Website">Website</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value as LeadStatus })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 rounded-xl font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 bg-violet-650 text-white rounded-xl font-semibold text-sm hover:bg-violet-750 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Lead'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 transition-all">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Lead Record</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you absolutely sure you want to delete lead <strong className="text-slate-800 dark:text-white">{leadToDelete.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setLeadToDelete(null);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350 hover:bg-slate-100 rounded-xl font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash className="w-4 h-4" />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SINGLE LEAD DETAILS MODAL */}
      {isDetailsModalOpen && detailsLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all">
            
            {/* Header */}
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-violet-500" />
                Lead Specifications
              </h3>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setDetailsLead(null);
                }}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-455 font-semibold">Lead ID</span>
                <span className="font-mono text-xs text-slate-800 dark:text-slate-300">{detailsLead._id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-455 font-semibold">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{detailsLead.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-455 font-semibold">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-300">{detailsLead.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-455 font-semibold">Source Route</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSourceBadge(detailsLead.source)}`}>
                  {detailsLead.source}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-455 font-semibold">Current Pipeline Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(detailsLead.status)}`}>
                  {detailsLead.status}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-455 font-semibold">Created Date</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {new Date(detailsLead.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-455 font-semibold">Last Modified</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {new Date(detailsLead.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  openCrudModal('edit', detailsLead);
                  setDetailsLead(null);
                }}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Details
              </button>
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setDetailsLead(null);
                }}
                className="px-4 py-2 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
