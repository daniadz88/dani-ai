import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ChatModule} from "./chat/chat.module";
import {HealthModule} from "./health/health.module";
import {HistoryModule} from "./history/history.module";
import {ChatSession} from "./history/history.entity";

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        TypeOrmModule.forRoot({
            type: "postgres",
            url: process.env.DATABASE_URL,
            ssl: {rejectUnauthorized: false},
            entities: [ChatSession],
            synchronize: true,
        }),
        ChatModule,
        HealthModule,
        HistoryModule,
    ],
})
export class AppModule {}
