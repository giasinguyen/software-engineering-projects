package com.movieticket.bookingservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.queue.booking-update}")
    private String bookingUpdateQueue;

    @Value("${app.rabbitmq.binding.payment-completed}")
    private String paymentCompletedKey;

    @Value("${app.rabbitmq.binding.booking-failed}")
    private String bookingFailedKey;

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(exchange);
    }

    @Bean
    public Queue bookingUpdateQueue() {
        return new Queue(bookingUpdateQueue, true);
    }

    @Bean
    public Binding paymentCompletedBinding() {
        return BindingBuilder.bind(bookingUpdateQueue())
                .to(exchange())
                .with(paymentCompletedKey);
    }

    @Bean
    public Binding bookingFailedBinding() {
        return BindingBuilder.bind(bookingUpdateQueue())
                .to(exchange())
                .with(bookingFailedKey);
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
