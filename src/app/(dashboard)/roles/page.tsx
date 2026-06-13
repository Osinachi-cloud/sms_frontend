'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';
import { roleApi } from '@/lib/api';
import { Role, Permission } from '@/types';
import { motion } from 'framer-motion';
import { Plus, Shield, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const roleSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
});

type RoleForm = z.infer<typeof roleSchema>;

export default function RolesPage() {
  const { currentSchool, hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
  });

  const fetchData = async () => {
    if (!currentSchool) return;
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleApi.getRoles(currentSchool.id),
        roleApi.getPermissionsGrouped(currentSchool.id),
      ]);
      setRoles(rolesRes.data as Role[]);
      setPermissions(permsRes.data as Record<string, Permission[]>);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentSchool]);

  const openModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setValue('name', role.name);
      setValue('description', role.description || '');
      setSelectedPermissions(new Set(role.permissions));
    } else {
      setEditingRole(null);
      reset();
      setSelectedPermissions(new Set());
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: RoleForm) => {
    if (!currentSchool) return;
    if (selectedPermissions.size === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      const payload = {
        ...data,
        permissions: Array.from(selectedPermissions),
      };

      if (editingRole) {
        await roleApi.updateRole(currentSchool.id, editingRole.id, payload);
        toast.success('Role updated');
      } else {
        await roleApi.createRole(currentSchool.id, payload);
        toast.success('Role created');
      }

      setIsModalOpen(false);
      reset();
      setSelectedPermissions(new Set());
      setEditingRole(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!currentSchool || !confirm('Are you sure you want to delete this role?')) return;
    try {
      await roleApi.deleteRole(currentSchool.id, roleId);
      toast.success('Role deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  const togglePermission = (key: string) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedPermissions(newSet);
  };

  const toggleCategory = (category: string) => {
    const categoryPerms = permissions[category]?.map(p => p.key) || [];
    const allSelected = categoryPerms.every(key => selectedPermissions.has(key));

    const newSet = new Set(selectedPermissions);
    categoryPerms.forEach(key => {
      if (allSelected) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
    });
    setSelectedPermissions(newSet);
  };

  if (!currentSchool) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Please select a school to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" data-tour="roles-list">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage custom roles for your school</p>
        </div>
        {hasPermission('role.create') && (
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4" />
            Create Role
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card hover>
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        {role.isSystemRole && (
                          <Badge variant="info" className="text-xs">System</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {role.description && (
                    <p className="text-sm text-slate-500 mb-4">{role.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {role.permissions.slice(0, 5).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs"
                      >
                        {perm.split('.').pop()}
                      </span>
                    ))}
                    {role.permissions.length > 5 && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                        +{role.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                  {!role.isSystemRole && hasPermission('role.update') && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openModal(role)}>
                        Edit
                      </Button>
                      {hasPermission('role.delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                          className="text-red-500"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); setEditingRole(null); setSelectedPermissions(new Set()); }}
        title={editingRole ? 'Edit Role' : 'Create Role'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('name')}
              label="Role Name"
              placeholder="e.g., Department Head"
              error={errors.name?.message}
              disabled={editingRole?.isSystemRole}
            />
            <Input
              {...register('description')}
              label="Description"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Permissions ({selectedPermissions.size} selected)
            </label>
            <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-hide pr-2">
              {Object.entries(permissions).map(([category, perms]) => {
                const categorySelected = perms.filter(p => selectedPermissions.has(p.key)).length;
                return (
                  <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex items-center justify-between w-full text-left mb-3"
                    >
                      <span className="font-medium">{category}</span>
                      <span className="text-sm text-slate-500">
                        {categorySelected}/{perms.length}
                      </span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm) => (
                        <button
                          key={perm.key}
                          type="button"
                          onClick={() => togglePermission(perm.key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            selectedPermissions.has(perm.key)
                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                              : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedPermissions.has(perm.key)
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {selectedPermissions.has(perm.key) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="truncate">{perm.key.split('.').slice(1).join('.')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
