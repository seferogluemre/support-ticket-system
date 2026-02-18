import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { Checkbox } from '#/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form';
import { Input } from '#/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Switch } from '#/components/ui/switch';
import { api } from '#/lib/api';
import type { UserShowResponse } from '#backend/modules/users/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Gender, UserScope } from '@onlyjs/db/enums';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Form schema for validation
const createUserSchema = z.object({
  email: z.string().email('Invalid email address').min(3).max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(32),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  gender: z.nativeEnum(Gender),
  scope: z.nativeEnum(UserScope).optional(),
  isActive: z.boolean().optional(),
  roleUuids: z.array(z.string()).min(1, 'At least one role is required'),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').min(3).max(255).optional(),
  password: z.string().min(8).max(32).optional().or(z.literal('')),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  gender: z.nativeEnum(Gender).optional(),
  isActive: z.boolean().optional(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

export type UserFormSubmitData = CreateFormData | UpdateFormData;

interface UserFormProps {
  mode: 'create' | 'edit';
  user?: UserShowResponse;
  onSubmit: (data: UserFormSubmitData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function UserForm({
  mode,
  user,
  onSubmit,
  onCancel,
  isLoading = false,
}: UserFormProps) {
  const [passwordValue, setPasswordValue] = useState('');
  
  const isCreateMode = mode === 'create';

  // Fetch system roles from backend
  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', 'system'],
    queryFn: async () => {
      const response = await api.auth.roles.get({
        // biome-ignore lint/suspicious/noExplicitAny: Eden API type inference issue
        query: { scope: 'global' } as any,
      });
      if (response.error) throw response.error;
      return response.data;
    },
  });

  const roles = rolesResponse ?? [];
  const isLoadingOptions = rolesLoading;

  // Password policy
  const passwordPolicy = {
    minLength: 8,
    maxLength: 32,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  };

  const form = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isCreateMode ? createUserSchema : updateUserSchema),
    defaultValues: isCreateMode 
      ? {
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          gender: Gender.MALE,
          scope: UserScope.COMPANY,
          isActive: true,
          roleUuids: [],
        }
      : {
          email: user?.email || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          gender: (user as unknown as { gender?: Gender })?.gender || Gender.MALE,
          isActive: user?.isActive ?? true,
          password: '',
        },
  });

  const handleFormSubmit = (data: CreateFormData | UpdateFormData) => {
    // Remove empty password for update mode
    if (!isCreateMode && 'password' in data && !data.password) {
      const { password, ...rest } = data;
      onSubmit(rest);
    } else {
      onSubmit(data);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                const hasMinLength = passwordValue.length >= passwordPolicy.minLength;
                const hasMaxLength = passwordValue.length <= passwordPolicy.maxLength;
                const hasUppercase = !passwordPolicy.requireUppercase || /[A-Z]/.test(passwordValue);
                const hasLowercase = !passwordPolicy.requireLowercase || /[a-z]/.test(passwordValue);
                const hasNumber = !passwordPolicy.requireNumbers || /[0-9]/.test(passwordValue);
                const hasSpecial = !passwordPolicy.requireSpecialChars || /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordValue);

                return (
                  <FormItem>
                    <FormLabel>
                      {isCreateMode ? 'Password *' : 'New Password'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={isCreateMode ? '••••••••' : 'Leave empty to keep current password'}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e);
                          setPasswordValue(e.target.value);
                        }}
                      />
                    </FormControl>
                    {/* Show password requirements when typing */}
                    {(isCreateMode || passwordValue) && (
                      <FormDescription>
                        {!isCreateMode && (
                          <span className="block mb-2">
                            Only fill this if you want to change the password
                          </span>
                        )}
                        <span className={`block ${passwordValue && !hasMinLength ? 'text-destructive' : ''}`}>
                          • Must be at least {passwordPolicy.minLength} characters
                        </span>
                        <span className={`block ${passwordValue && !hasMaxLength ? 'text-destructive' : ''}`}>
                          • Must not exceed {passwordPolicy.maxLength} characters
                        </span>
                        {passwordPolicy.requireUppercase && (
                          <span className={`block ${passwordValue && !hasUppercase ? 'text-destructive' : ''}`}>
                            • Must contain at least one uppercase letter (A-Z)
                          </span>
                        )}
                        {passwordPolicy.requireLowercase && (
                          <span className={`block ${passwordValue && !hasLowercase ? 'text-destructive' : ''}`}>
                            • Must contain at least one lowercase letter (a-z)
                          </span>
                        )}
                        {passwordPolicy.requireNumbers && (
                          <span className={`block ${passwordValue && !hasNumber ? 'text-destructive' : ''}`}>
                            • Must contain at least one number (0-9)
                          </span>
                        )}
                        {passwordPolicy.requireSpecialChars && (
                          <span className={`block ${passwordValue && !hasSpecial ? 'text-destructive' : ''}`}>
                            • Must contain at least one special character
                          </span>
                        )}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                      <SelectItem value={Gender.NON_BINARY}>Non-Binary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCreateMode && (
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserScope.SYSTEM}>System</SelectItem>
                        <SelectItem value={UserScope.COMPANY}>Company</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      System scope users can access admin features
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Enable or disable this user account
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Roles - only for create mode */}
        {isCreateMode && (
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="roleUuids"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Roles *</FormLabel>
                      <FormDescription>
                        Assign roles to define permissions (at least one required)
                      </FormDescription>
                    </div>
                    {isLoadingOptions ? (
                      <div className="text-sm text-muted-foreground">
                        Loading roles...
                      </div>
                    ) : roles.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No roles available
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                        {roles.map((role) => (
                          <FormField
                            key={role.uuid}
                            control={form.control}
                            name="roleUuids"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={role.uuid}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(role.uuid)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...(field.value || []),
                                              role.uuid,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value: string) => value !== role.uuid
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal">
                                      {role.name}
                                    </FormLabel>
                                    {role.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {role.description}
                                      </p>
                                    )}
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isLoadingOptions}>
            {isLoading ? 'Saving...' : isCreateMode ? 'Create User' : 'Update User'}
          </Button>
        </div>
      </form>
    </Form>
  );
}