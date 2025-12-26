import User, { IUser, IAddress } from '../models/User.model';
import { ApiError } from '../utils/ApiError';

class UserService {
    async getUserById(userId: string): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw ApiError.notFound('User not found');
        }
        return user;
    }

    async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // Only allow updating certain fields
        const allowedFields = ['name', 'phone', 'avatar'];
        Object.keys(data).forEach((key) => {
            if (allowedFields.includes(key)) {
                (user as any)[key] = (data as any)[key];
            }
        });

        await user.save();
        return user;
    }

    async addAddress(userId: string, address: IAddress): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        // If this is the first address or marked as default, set it as default
        if (user.addresses.length === 0 || address.isDefault) {
            user.addresses.forEach((addr) => {
                addr.isDefault = false;
            });
            address.isDefault = true;
        }

        user.addresses.push(address);
        await user.save();
        return user;
    }

    async updateAddress(userId: string, addressId: string, data: Partial<IAddress>): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            throw ApiError.notFound('Address not found');
        }

        // If setting as default, unset other defaults
        if (data.isDefault) {
            user.addresses.forEach((addr) => {
                addr.isDefault = false;
            });
        }

        Object.assign(address, data);
        await user.save();
        return user;
    }

    async deleteAddress(userId: string, addressId: string): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            throw ApiError.notFound('Address not found');
        }

        const wasDefault = address.isDefault;
        user.addresses.pull(addressId);

        // If deleted address was default, set first address as default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        return user;
    }
}

export default new UserService();
