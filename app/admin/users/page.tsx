"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, UserPlus, Loader2, Search, Shield, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { usersService } from "@/lib/services/usersService"
import { User } from "@/lib/types"

const ROLES = [
    { value: 'user', label: 'User', description: 'Regular user with basic access' },
    { value: 'admin', label: 'Admin', description: 'Full access to admin panel' },
    { value: 'moderator', label: 'Moderator', description: 'Can moderate content' },
]

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Edit Role Dialog
    const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [selectedRole, setSelectedRole] = useState('')
    const [updating, setUpdating] = useState(false)

    // Delete Confirmation Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const fetchUsers = async () => {
        try {
            const data = await usersService.getUsers()
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getTimeSince = (dateString: string | null) => {
        if (!dateString) return 'Never'
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min ago`
        if (diffHours < 24) return `${diffHours} hours ago`
        return `${diffDays} days ago`
    }

    const openEditRoleDialog = (user: User) => {
        setSelectedUser(user)
        setSelectedRole(user.role || 'user')
        setEditRoleDialogOpen(true)
    }

    const openDeleteDialog = (user: User) => {
        setSelectedUser(user)
        setDeleteDialogOpen(true)
    }

    const handleUpdateRole = async () => {
        if (!selectedUser || !selectedRole) return

        setUpdating(true)
        try {
            await usersService.updateUserRole(selectedUser.id, selectedRole)
            await fetchUsers()
            setEditRoleDialogOpen(false)
            alert('User role updated successfully! ✅')
        } catch (error) {
            console.error('Error updating role:', error)
            alert('Failed to update user role')
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!selectedUser) return

        setDeleting(true)
        try {
            await usersService.deleteUser(selectedUser.id)
            await fetchUsers()
            setDeleteDialogOpen(false)
            alert('User access revoked successfully! 🗑️')
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Failed to revoke user access')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
                    <p className="text-muted-foreground text-sm">{users.length} users registered</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    {searchQuery ? 'No users found matching your search' : 'No users yet'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                            )}
                                            {user.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "admin" ? "default" : user.role === "moderator" ? "secondary" : "outline"}>
                                            {user.role || 'User'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {getTimeSince(user.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openEditRoleDialog(user)}>
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Edit Role
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => openDeleteDialog(user)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Revoke Access
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Role Dialog */}
            <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User Role</DialogTitle>
                        <DialogDescription>
                            Change the role for {selectedUser?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            {selectedUser?.avatar_url ? (
                                <img src={selectedUser.avatar_url} alt={selectedUser.name} className="w-10 h-10 rounded-full" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                                    {selectedUser?.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="font-medium">{selectedUser?.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Select Role</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map(role => (
                                        <SelectItem key={role.value} value={role.value}>
                                            <div>
                                                <span className="font-medium">{role.label}</span>
                                                <span className="text-muted-foreground text-xs ml-2">- {role.description}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateRole} disabled={updating}>
                            {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke User Access</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke access for {selectedUser?.name}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                            {selectedUser?.avatar_url ? (
                                <img src={selectedUser.avatar_url} alt={selectedUser.name} className="w-10 h-10 rounded-full" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center font-bold text-destructive">
                                    {selectedUser?.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="font-medium">{selectedUser?.name}</p>
                                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
                            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Revoke Access
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

