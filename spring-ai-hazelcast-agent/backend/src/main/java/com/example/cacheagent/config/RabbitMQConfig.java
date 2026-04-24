package com.example.cacheagent.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình RabbitMQ:
 *  - Queue  : cache-agent.write-events  (durable)
 *  - Exchange: cache-agent.exchange     (topic)
 *  - Binding : routing key = write-event
 *
 * Pattern: Async Write-Through
 *  Controller → publish WriteEvent → RabbitMQ → Consumer → DB + Cache
 */
@Slf4j
@Configuration
public class RabbitMQConfig {

    public static final String QUEUE       = "cache-agent.write-events";
    public static final String EXCHANGE    = "cache-agent.exchange";
    public static final String ROUTING_KEY = "write-event";

    @Bean
    public Queue writeEventQueue() {
        // durable=true: queue tồn tại khi broker restart
        return QueueBuilder.durable(QUEUE).build();
    }

    @Bean
    public TopicExchange writeEventExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Binding writeEventBinding(Queue writeEventQueue, TopicExchange writeEventExchange) {
        return BindingBuilder
                .bind(writeEventQueue)
                .to(writeEventExchange)
                .with(ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        log.info("[MQ CONFIG] RabbitTemplate khởi tạo → exchange={}", EXCHANGE);
        return template;
    }
}
