declare module 'midtrans-client' {
    interface SnapConfig {
        isProduction: boolean
        serverKey: string
        clientKey: string
    }

    interface CoreApiConfig {
        isProduction: boolean
        serverKey: string
        clientKey: string
    }

    interface TransactionDetails {
        order_id: string
        gross_amount: number
    }

    interface ItemDetail {
        id: string
        price: number
        quantity: number
        name: string
    }

    interface CustomerDetails {
        first_name?: string
        last_name?: string
        email?: string
        phone?: string
    }

    interface Callbacks {
        finish?: string
        error?: string
        pending?: string
    }

    interface TransactionParameter {
        transaction_details: TransactionDetails
        item_details?: ItemDetail[]
        customer_details?: CustomerDetails
        callbacks?: Callbacks
    }

    interface TransactionResult {
        token: string
        redirect_url: string
    }

    class Snap {
        constructor(config: SnapConfig)
        createTransaction(parameter: TransactionParameter): Promise<TransactionResult>
    }

    class CoreApi {
        constructor(config: CoreApiConfig)
        transaction: {
            status(orderId: string): Promise<any>
        }
    }

    export { Snap, CoreApi }
    export default { Snap, CoreApi }
}
